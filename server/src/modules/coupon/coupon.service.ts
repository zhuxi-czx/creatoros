import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CouponService {
  constructor(private prisma: PrismaService) {}

  /** 新用户注册赠 1 张 10 元酒水券，有效期 1 个月。供 auth 调用。 */
  static newUserCouponData(userId: string) {
    const expireAt = new Date();
    expireAt.setMonth(expireAt.getMonth() + 1);
    return {
      userId,
      type: 'DRINK_10' as const,
      title: '新人专享酒水券',
      amount: 1000, // 10 元 = 1000 分
      expireAt,
    };
  }

  /** 把已过期但仍 UNUSED 的券标记为 EXPIRED。 */
  private async markExpired(userId: string) {
    await this.prisma.coupon.updateMany({
      where: { userId, status: 'UNUSED', expireAt: { lt: new Date() } },
      data: { status: 'EXPIRED' },
    });
  }

  /** 我的优惠券列表（先结算过期态，再返回）。 */
  async listMine(userId: string) {
    await this.markExpired(userId);
    return this.prisma.coupon.findMany({
      where: { userId },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
  }

  /** 使用（核销）优惠券：UNUSED 且未过期 → USED。 */
  async use(userId: string, id: string) {
    const c = await this.prisma.coupon.findUnique({ where: { id } });
    if (!c || c.userId !== userId) throw new NotFoundException('优惠券不存在');
    if (c.expireAt < new Date()) {
      await this.prisma.coupon.updateMany({ where: { id, status: 'UNUSED' }, data: { status: 'EXPIRED' } });
      throw new BadRequestException('优惠券已过期');
    }
    // 乐观锁：仅当仍为 UNUSED 才核销，防并发重复使用
    const r = await this.prisma.coupon.updateMany({
      where: { id, status: 'UNUSED' },
      data: { status: 'USED', usedAt: new Date() },
    });
    if (r.count === 0) throw new BadRequestException('优惠券不可用');
    return { success: true };
  }

  /** 删除已失效（过期）的券。 */
  async remove(userId: string, id: string) {
    const c = await this.prisma.coupon.findUnique({ where: { id } });
    if (!c || c.userId !== userId) throw new NotFoundException('优惠券不存在');
    if (c.status === 'UNUSED' && c.expireAt >= new Date()) {
      throw new BadRequestException('有效券不可删除');
    }
    await this.prisma.coupon.delete({ where: { id } });
    return { success: true };
  }
}
