import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WechatPayService, JsapiPayParams } from './wechat-pay.service';
import {
  MembershipService,
  MEMBERSHIP_PRICE,
  computeRenewExpiry,
  periodKeyOf,
  freeTypeOf,
} from '../membership/membership.service';

/** 订单超时分钟数（与微信 time_expire 一致，超时释放名额）。 */
const ORDER_TTL_MIN = 15;

/** 事务回调内的 client 类型（与 PrismaService.$transaction 一致）。 */
type TxClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private prisma: PrismaService,
    private wechatPay: WechatPayService,
    private membership: MembershipService,
  ) {}

  /**
   * 付费报名下单：校验名额 → 创建/复用待支付订单 → 微信 JSAPI 下单 → 返回支付参数。
   * 名额在下单时即占用（计入"未过期待支付订单"），超时未付由定时任务释放。
   */
  async checkout(
    userId: string,
    eventId: string,
  ): Promise<{ orderId?: string; payParams?: JsapiPayParams; free?: boolean }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.openId) {
      throw new BadRequestException('用户缺少 openId，无法发起支付');
    }

    const eventFull = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { category: true },
    });
    if (!eventFull) throw new NotFoundException('活动不存在');
    if (eventFull.status !== 'PUBLISHED') {
      throw new BadRequestException(
        eventFull.status === 'FULL' ? '活动名额已满' : '活动当前不可报名',
      );
    }
    if (eventFull.price <= 0) {
      throw new BadRequestException('免费活动请走普通报名接口');
    }

    const pricing = await this.membership.computePricing(eventFull, userId);

    // 会员免费名额：占名额 + 扣免费名额在同一事务，不走支付
    if (pricing.finalPrice === 0) {
      await this.prisma.$transaction(async (tx) => {
        await this.assertSignable(tx, userId, eventId, eventFull.maxCapacity);
        await tx.signup.upsert({
          where: { userId_eventId: { userId, eventId } },
          create: { userId, eventId, status: 'CONFIRMED' },
          update: { status: 'CONFIRMED', orderId: null },
        });
        const freeType = freeTypeOf(eventFull);
        if (freeType) {
          const m = await tx.membership.findUnique({ where: { userId } });
          if (m) {
            await tx.membershipBenefitUsage
              .create({ data: { membershipId: m.id, periodKey: periodKeyOf(m.startAt), benefitType: freeType as any, eventId } })
              .catch(() => undefined); // 名额已用（unique 冲突）幂等忽略
          }
        }
      });
      return { free: true };
    }

    // 付费下单（金额 = 会员价或原价）
    const order = await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const reusable = await tx.order.findFirst({
        where: { userId, eventId, type: 'EVENT', status: 'PENDING', expiresAt: { gt: now } },
      });
      if (reusable) return reusable;
      await this.assertSignable(tx, userId, eventId, eventFull.maxCapacity);
      const expiresAt = new Date(now.getTime() + ORDER_TTL_MIN * 60 * 1000);
      return tx.order.create({
        data: {
          outTradeNo: this.genOutTradeNo(),
          userId,
          type: 'EVENT',
          eventId,
          amount: pricing.finalPrice,
          status: 'PENDING',
          expiresAt,
        },
      });
    });

    const payParams = await this.wechatPay.createJsapiOrder({
      description: `报名：${eventFull.title}`.slice(0, 127),
      outTradeNo: order.outTradeNo,
      amount: order.amount,
      openId: user.openId,
      expiresAt: order.expiresAt,
    });
    await this.prisma.order.update({
      where: { id: order.id },
      data: { prepayId: payParams.package.replace('prepay_id=', '') },
    });
    return { orderId: order.id, payParams };
  }

  /** 购买 PlanF 会员（998/年）下单，返回支付参数。 */
  async checkoutMembership(
    userId: string,
  ): Promise<{ orderId: string; payParams: JsapiPayParams }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.openId) {
      throw new BadRequestException('用户缺少 openId，无法发起支付');
    }
    const now = new Date();
    let order = await this.prisma.order.findFirst({
      where: { userId, type: 'MEMBERSHIP', status: 'PENDING', expiresAt: { gt: now } },
    });
    if (!order) {
      const expiresAt = new Date(now.getTime() + ORDER_TTL_MIN * 60 * 1000);
      order = await this.prisma.order.create({
        data: {
          outTradeNo: this.genOutTradeNo(),
          userId,
          type: 'MEMBERSHIP',
          amount: MEMBERSHIP_PRICE,
          status: 'PENDING',
          expiresAt,
        },
      });
    }
    const payParams = await this.wechatPay.createJsapiOrder({
      description: 'PlanF 会员（年）',
      outTradeNo: order.outTradeNo,
      amount: order.amount,
      openId: user.openId,
      expiresAt: order.expiresAt,
    });
    await this.prisma.order.update({
      where: { id: order.id },
      data: { prepayId: payParams.package.replace('prepay_id=', '') },
    });
    return { orderId: order.id, payParams };
  }

  /**
   * 处理微信支付结果回调（已验签解密）。幂等：重复投递安全。
   * 支付成功 → 订单置 PAID + 确认报名（即使订单已超时关单也honor付款，避免收钱不报名）。
   */
  async confirmPaid(outTradeNo: string, transactionId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { outTradeNo } });
      if (!order) {
        this.logger.warn(`回调订单不存在: ${outTradeNo}`);
        return;
      }
      if (order.status === 'PAID') return; // 幂等

      await tx.order.update({
        where: { id: order.id },
        data: { status: 'PAID', transactionId, paidAt: new Date(), closedAt: null },
      });

      // 会员订单：支付成功即开通/续费（续费从原到期日顺延，入会日不变）
      if (order.type === 'MEMBERSHIP') {
        const now = new Date();
        const existing = await tx.membership.findUnique({ where: { userId: order.userId } });
        const { expireAt, renewing } = computeRenewExpiry(existing, now);
        await tx.membership.upsert({
          where: { userId: order.userId },
          create: { userId: order.userId, status: 'ACTIVE', startAt: now, expireAt },
          update: { status: 'ACTIVE', ...(renewing ? {} : { startAt: now }), expireAt },
        });
        return;
      }
      const eventId = order.eventId;
      if (!eventId) return;

      // 创建/确认报名并关联订单
      const signup = await tx.signup.upsert({
        where: { userId_eventId: { userId: order.userId, eventId } },
        create: {
          userId: order.userId,
          eventId,
          status: 'CONFIRMED',
          orderId: order.id,
        },
        update: { status: 'CONFIRMED', orderId: order.id },
      });

      // 满员则置 FULL
      const confirmed = await tx.signup.count({
        where: { eventId, status: 'CONFIRMED' },
      });
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (event && confirmed >= event.maxCapacity && event.status === 'PUBLISHED') {
        await tx.event.update({
          where: { id: eventId },
          data: { status: 'FULL' },
        });
      }
      this.logger.log(`支付成功确认报名: order=${order.id} signup=${signup.id}`);
    });
  }

  /** 查询订单（含报名状态），供前端轮询；校验归属。 */
  async getOrder(userId: string, orderId: string) {
    let order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { signup: { select: { status: true } } },
    });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.userId !== userId) throw new ForbiddenException('无权查看该订单');

    // 兜底：未确认收款时主动向微信查单（回调可能丢失/失败），
    // 含已被超时关单(CLOSED)的单——若微信侧已收款则补确认报名，避免收钱不报名。
    if (order.status === 'PENDING' || order.status === 'CLOSED') {
      const state = await this.wechatPay.queryOrderState(order.outTradeNo);
      if (state?.tradeState === 'SUCCESS') {
        await this.confirmPaid(order.outTradeNo, state.transactionId);
        order = await this.prisma.order.findUnique({
          where: { id: orderId },
          include: { signup: { select: { status: true } } },
        });
      }
    }
    if (!order) throw new NotFoundException('订单不存在');

    return {
      id: order.id,
      status: order.status,
      amount: order.amount,
      eventId: order.eventId,
      paid: order.status === 'PAID',
      signupStatus: order.signup?.status ?? null,
    };
  }

  /**
   * 退款核心（原路退回）。以「订单是否 PAID」为准，与报名状态解耦：
   * 报名即使已取消，只要钱已收且未退，仍可退款（避免收钱不退）。
   *
   * 安全要点（支付敏感）：
   * - 用 updateMany(status:PAID→REFUNDING) 做乐观锁，防并发/重复点击重复退款。
   * - 先锁单再调微信；微信拒绝则回滚为 PAID 供重试。
   * - 微信受理(SUCCESS/PROCESSING)后取消报名、释放名额、必要时 FULL→PUBLISHED。
   *
   * @returns status: SUCCESS/PROCESSING/REFUNDED(幂等)/NO_PAYMENT(无可退订单)
   */
  async refundSignup(
    signupId: string,
    opts?: { reason?: string },
  ): Promise<{ status: string; refunded: boolean }> {
    const signup = await this.prisma.signup.findUnique({
      where: { id: signupId },
      include: { order: true },
    });
    if (!signup) throw new NotFoundException('报名记录不存在');

    const order = signup.order;
    // 免费报名/未支付/已关单：无可退款订单
    if (!order || order.status === 'PENDING' || order.status === 'CLOSED') {
      return { status: 'NO_PAYMENT', refunded: false };
    }
    if (order.status === 'REFUNDED') return { status: 'REFUNDED', refunded: true }; // 幂等
    if (order.status === 'REFUNDING') {
      throw new ConflictException('退款处理中，请稍后刷新');
    }

    // 乐观锁：PAID → REFUNDING，原子占用，防重复退款
    const refundNo = 'rf' + order.outTradeNo.slice(2);
    const locked = await this.prisma.order.updateMany({
      where: { id: order.id, status: 'PAID' },
      data: { status: 'REFUNDING', refundNo },
    });
    if (locked.count === 0) {
      throw new ConflictException('订单状态已变化，请刷新重试');
    }

    // 调微信退款（事务外）。失败回滚为 PAID 供重试。
    const result = await this.wechatPay.refund({
      outTradeNo: order.outTradeNo,
      outRefundNo: refundNo,
      amount: order.amount,
      reason: opts?.reason ?? '活动报名退款',
    });
    if (!result || result.status === 'ABNORMAL' || result.status === 'CLOSED') {
      await this.prisma.order.updateMany({
        where: { id: order.id, status: 'REFUNDING' },
        data: { status: 'PAID' },
      });
      throw new ServiceUnavailableException('微信退款失败，请稍后重试');
    }

    // 微信已受理：取消报名、释放名额。SUCCESS 置 REFUNDED，PROCESSING 留 REFUNDING。
    const done = result.status === 'SUCCESS';
    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: done ? 'REFUNDED' : 'REFUNDING',
          refundedAt: done ? new Date() : null,
        },
      });
      if (signup.status !== 'CANCELLED') {
        await tx.signup.update({
          where: { id: signup.id },
          data: { status: 'CANCELLED' },
        });
      }
      const ev = await tx.event.findUnique({ where: { id: signup.eventId } });
      if (ev && ev.status === 'FULL') {
        const confirmed = await tx.signup.count({
          where: { eventId: ev.id, status: 'CONFIRMED' },
        });
        if (confirmed < ev.maxCapacity) {
          await tx.event.update({
            where: { id: ev.id },
            data: { status: 'PUBLISHED' },
          });
        }
      }
    });
    this.logger.log(`退款受理 order=${order.id} status=${result.status}`);
    return { status: result.status, refunded: done };
  }

  /** 后台对某条报名发起退款（原路退回）。报名状态不限，以订单 PAID 为准。 */
  async adminRefundSignup(signupId: string) {
    const r = await this.refundSignup(signupId, { reason: '后台退款' });
    if (r.status === 'NO_PAYMENT') {
      throw new BadRequestException('该报名无可退款的支付订单（免费报名或未支付）');
    }
    return r;
  }

  /**
   * 定时任务调用：对账处理中(REFUNDING)的退款单，
   * 查微信确认已退款则置 REFUNDED，避免长期卡在「退款中」。
   */
  async reconcileRefundingOrders(): Promise<number> {
    const refunding = await this.prisma.order.findMany({
      where: { status: 'REFUNDING', refundNo: { not: null } },
      select: { id: true, refundNo: true },
    });
    let done = 0;
    for (const o of refunding) {
      const r = await this.wechatPay.queryRefund(o.refundNo!);
      if (r?.status === 'SUCCESS') {
        await this.prisma.order.update({
          where: { id: o.id },
          data: { status: 'REFUNDED', refundedAt: new Date() },
        });
        done++;
      } else if (r?.status === 'ABNORMAL') {
        this.logger.error(`退款异常需人工处理 order=${o.id} refundNo=${o.refundNo}`);
      }
    }
    if (done > 0) this.logger.log(`对账完成退款 ${done} 笔`);
    return done;
  }

  /** 定时任务调用：关闭超时未支付订单（释放名额由名额查询自动生效）。 */
  async closeExpiredOrders(): Promise<number> {
    const res = await this.prisma.order.updateMany({
      where: { status: 'PENDING', expiresAt: { lt: new Date() } },
      data: { status: 'CLOSED', closedAt: new Date() },
    });
    if (res.count > 0) this.logger.log(`关闭超时订单 ${res.count} 笔`);
    return res.count;
  }

  /** 已占名额 = 已确认报名 + 未过期待支付订单。 */
  /** 报名前校验：未重复报名 + 名额未满（事务内复用）。 */
  private async assertSignable(
    tx: TxClient,
    userId: string,
    eventId: string,
    maxCapacity: number,
  ) {
    const existing = await tx.signup.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    if (existing?.status === 'CONFIRMED') throw new ConflictException('你已报名该活动');
    const occupied = await this.countOccupied(tx, eventId, new Date());
    if (occupied >= maxCapacity) throw new BadRequestException('活动名额已满');
  }

  private async countOccupied(
    tx: TxClient,
    eventId: string,
    now: Date,
  ): Promise<number> {
    const [confirmed, pending] = await Promise.all([
      tx.signup.count({ where: { eventId, status: 'CONFIRMED' } }),
      tx.order.count({
        where: { eventId, status: 'PENDING', expiresAt: { gt: now } },
      }),
    ]);
    return confirmed + pending;
  }

  /** 商户订单号：时间戳 + 随机串，确保唯一且可读。 */
  private genOutTradeNo(): string {
    const ts = Date.now().toString();
    const rand = Math.random().toString(36).slice(2, 10);
    return `co${ts}${rand}`;
  }
}
