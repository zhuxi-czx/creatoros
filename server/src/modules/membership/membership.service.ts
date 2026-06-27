import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export const MEMBERSHIP_PRICE = 99800; // 998 元（分）
const MEMBER_DISCOUNT = 0.8; // 日常活动 8 折
export const MEMBERSHIP_DAYS = 365; // 一年期

export type FreeBenefit = 'GUEST_FREE';

export interface Pricing {
  originalPrice: number;
  isMember: boolean;
  isFreeEvent: boolean;
  memberPrice: number;
  finalPrice: number;
  freeType: FreeBenefit | null;
  freeAvailable: boolean;
  memberOnly: boolean; // PlanF 专享：仅会员可报名
  canSignup: boolean; // 当前用户是否可报名（专享非会员为 false）
}

// ===== 纯函数（无副作用，供 service 与下单事务复用）=====

/** 当前「会员月」序号（按入会日为边界），用作 periodKey。避免 setMonth 月末溢出。 */
export function periodKeyOf(startAt: Date, now = new Date()): string {
  let months =
    (now.getFullYear() - startAt.getFullYear()) * 12 + (now.getMonth() - startAt.getMonth());
  // 入会日可能超过当月天数（如 31 日入会遇到 2 月）→ 以当月最后一天为界，避免短月丢失免费名额
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const anchor = Math.min(startAt.getDate(), daysInMonth);
  if (now.getDate() < anchor) months -= 1; // 本月还没到入会日锚点 → 算上一个会员月
  return String(months);
}

/** 活动对应的免费名额类型（仅大咖分享，每月 1 次）。群友聚会已并入 PlanF 专享。 */
export function freeTypeOf(event: any): FreeBenefit | null {
  if (event.isGuestShare) return 'GUEST_FREE';
  return null;
}

/** 开通/续费到期时间（续费从原到期日顺延，入会日不变）。 */
export function computeRenewExpiry(
  existing: { status: string; startAt: Date; expireAt: Date } | null,
  now: Date,
): { startAt: Date; expireAt: Date; renewing: boolean } {
  const renewing = !!existing && existing.status === 'ACTIVE' && existing.expireAt > now;
  const base = renewing ? new Date(existing!.expireAt) : now;
  const expireAt = new Date(base);
  expireAt.setDate(expireAt.getDate() + MEMBERSHIP_DAYS);
  return { startAt: renewing ? existing!.startAt : now, expireAt, renewing };
}

@Injectable()
export class MembershipService {
  constructor(private prisma: PrismaService) {}

  async getMembership(userId: string) {
    const m = await this.prisma.membership.findUnique({ where: { userId } });
    if (!m) return null;
    if (m.status === 'ACTIVE' && m.expireAt < new Date()) {
      // 带守卫的条件更新，避免覆盖并发的续费写（续费会把 expireAt 推到未来）
      const now = new Date();
      await this.prisma.membership.updateMany({
        where: { userId, status: 'ACTIVE', expireAt: { lt: now } },
        data: { status: 'EXPIRED' },
      });
      return { ...m, status: 'EXPIRED' as const };
    }
    return m;
  }

  async isActive(userId: string) {
    const m = await this.getMembership(userId);
    return !!m && m.status === 'ACTIVE';
  }

  /** 开通/续费（可传事务 client；confirmPaid 在支付回调事务内复用此方法）。 */
  async activateInTx(tx: any, userId: string) {
    const now = new Date();
    const existing = await tx.membership.findUnique({ where: { userId } });
    const { expireAt, renewing } = computeRenewExpiry(existing, now);
    return tx.membership.upsert({
      where: { userId },
      create: { userId, status: 'ACTIVE', startAt: now, expireAt },
      update: { status: 'ACTIVE', ...(renewing ? {} : { startAt: now }), expireAt },
    });
  }

  /** 支付成功后开通/续费。 */
  async activate(userId: string) {
    return this.activateInTx(this.prisma, userId);
  }

  /** 价格计算：传入的 event 需 include category。 */
  async computePricing(event: any, userId?: string): Promise<Pricing> {
    const price = event.price as number;
    const member = userId ? await this.getMembership(userId) : null;
    const isMember = !!member && member.status === 'ACTIVE';

    // PlanF 专享：仅会员可报名，会员免费（非会员 canSignup=false → 引导开通会员）
    if (event.isPlanfExclusive) {
      return { originalPrice: price, isMember, isFreeEvent: true, memberPrice: 0, finalPrice: 0, freeType: null, freeAvailable: false, memberOnly: true, canSignup: isMember };
    }
    // 普通免费活动：所有人免费
    if (price <= 0) {
      return { originalPrice: price, isMember, isFreeEvent: true, memberPrice: 0, finalPrice: 0, freeType: null, freeAvailable: false, memberOnly: false, canSignup: true };
    }
    const memberPrice = Math.round(price * MEMBER_DISCOUNT);
    if (!isMember) {
      return { originalPrice: price, isMember: false, isFreeEvent: false, memberPrice, finalPrice: price, freeType: null, freeAvailable: false, memberOnly: false, canSignup: true };
    }
    const freeType = freeTypeOf(event);
    let freeAvailable = false;
    if (freeType) {
      const pk = periodKeyOf(member!.startAt);
      const used = await this.prisma.membershipBenefitUsage.findUnique({
        where: { membershipId_periodKey_benefitType: { membershipId: member!.id, periodKey: pk, benefitType: freeType as any } },
      });
      freeAvailable = !used;
    }
    return {
      originalPrice: price, isMember: true, isFreeEvent: false, memberPrice, freeType, freeAvailable,
      finalPrice: freeAvailable ? 0 : memberPrice, memberOnly: false, canSignup: true,
    };
  }

  /** 我的会员页：状态 + 本月免费名额剩余。 */
  async getMyInfo(userId: string) {
    const m = await this.getMembership(userId);
    if (!m || m.status !== 'ACTIVE') return { isMember: false };
    const pk = periodKeyOf(m.startAt);
    const usages = await this.prisma.membershipBenefitUsage.findMany({ where: { membershipId: m.id, periodKey: pk } });
    const used = usages.map((u) => u.benefitType);
    return {
      isMember: true,
      expireAt: m.expireAt,
      guestFreeLeft: used.includes('GUEST_FREE' as any) ? 0 : 1,
    };
  }
}
