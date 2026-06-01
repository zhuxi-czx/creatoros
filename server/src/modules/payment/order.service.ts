import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WechatPayService, JsapiPayParams } from './wechat-pay.service';

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
  ) {}

  /**
   * 付费报名下单：校验名额 → 创建/复用待支付订单 → 微信 JSAPI 下单 → 返回支付参数。
   * 名额在下单时即占用（计入"未过期待支付订单"），超时未付由定时任务释放。
   */
  async checkout(
    userId: string,
    eventId: string,
  ): Promise<{ orderId: string; payParams: JsapiPayParams }> {
    // 取用户 openId（JSAPI 下单必需）
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.openId) {
      throw new BadRequestException('用户缺少 openId，无法发起支付');
    }

    const order = await this.prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event) throw new NotFoundException('活动不存在');
      if (event.status !== 'PUBLISHED') {
        throw new BadRequestException(
          event.status === 'FULL' ? '活动名额已满' : '活动当前不可报名',
        );
      }
      if (event.price <= 0) {
        throw new BadRequestException('免费活动请走普通报名接口');
      }

      // 已确认报名 → 不可重复
      const existingSignup = await tx.signup.findUnique({
        where: { userId_eventId: { userId, eventId } },
      });
      if (existingSignup?.status === 'CONFIRMED') {
        throw new ConflictException('你已报名该活动');
      }

      // 复用未过期的待支付订单（用户重复点击/中断后重进）
      const now = new Date();
      const reusable = await tx.order.findFirst({
        where: {
          userId,
          eventId,
          status: 'PENDING',
          expiresAt: { gt: now },
        },
      });
      if (reusable) return reusable;

      // 名额校验：已确认报名 + 未过期待支付订单
      const occupied = await this.countOccupied(tx, eventId, now);
      if (occupied >= event.maxCapacity) {
        throw new BadRequestException('活动名额已满');
      }

      const expiresAt = new Date(now.getTime() + ORDER_TTL_MIN * 60 * 1000);
      return tx.order.create({
        data: {
          outTradeNo: this.genOutTradeNo(),
          userId,
          eventId,
          amount: event.price,
          status: 'PENDING',
          expiresAt,
        },
      });
    });

    // 网络调用放在事务外。下单失败时订单留 PENDING，超时自动关单释放名额。
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    const payParams = await this.wechatPay.createJsapiOrder({
      description: `报名：${event!.title}`.slice(0, 127),
      outTradeNo: order.outTradeNo,
      amount: order.amount,
      openId: user.openId,
      expiresAt: order.expiresAt,
    });

    // 记录 prepay 包（便于排查）
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

      // 创建/确认报名并关联订单
      const signup = await tx.signup.upsert({
        where: { userId_eventId: { userId: order.userId, eventId: order.eventId } },
        create: {
          userId: order.userId,
          eventId: order.eventId,
          status: 'CONFIRMED',
          orderId: order.id,
        },
        update: { status: 'CONFIRMED', orderId: order.id },
      });

      // 满员则置 FULL
      const confirmed = await tx.signup.count({
        where: { eventId: order.eventId, status: 'CONFIRMED' },
      });
      const event = await tx.event.findUnique({ where: { id: order.eventId } });
      if (event && confirmed >= event.maxCapacity && event.status === 'PUBLISHED') {
        await tx.event.update({
          where: { id: order.eventId },
          data: { status: 'FULL' },
        });
      }
      this.logger.log(`支付成功确认报名: order=${order.id} signup=${signup.id}`);
    });
  }

  /** 查询订单（含报名状态），供前端轮询；校验归属。 */
  async getOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { signup: { select: { status: true } } },
    });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.userId !== userId) throw new ForbiddenException('无权查看该订单');
    return {
      id: order.id,
      status: order.status,
      amount: order.amount,
      eventId: order.eventId,
      paid: order.status === 'PAID',
      signupStatus: order.signup?.status ?? null,
    };
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
