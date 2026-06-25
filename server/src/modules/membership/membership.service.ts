import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export const MEMBERSHIP_PRICE = 99800; // 998 元（分）
const MEMBER_DISCOUNT = 0.8; // 日常活动 8 折
export const MEMBERSHIP_DAYS = 365; // 一年期

export type FreeBenefit = 'GUEST_FREE' | 'GATHERING_FREE';

export interface Pricing {
  originalPrice: number;
  isMember: boolean;
  isFreeEvent: boolean;
  memberPrice: number;
  finalPrice: number;
  freeType: FreeBenefit | null;
  freeAvailable: boolean;
}

// ===== 纯函数（无副作用，供 service 与下单事务复用）=====

/** 当前「会员月」序号（按入会日为边界），用作 periodKey。避免 setMonth 月末溢出。 */
export function periodKeyOf(startAt: Date, now = new Date()): string {
  let months =
    (now.getFullYear() - startAt.getFullYear()) * 12 + (now.getMonth() - startAt.getMonth());
  if (now.getDate() < startAt.getDate()) months -= 1; // 本月还没到入会日 → 算上一个会员月
  return String(months);
}

/** 活动对应的免费名额类型（大咖 / 群友聚会分类）。 */
export function freeTypeOf(event: any): FreeBenefit | null {
  if (event.isGuestShare) return 'GUEST_FREE';
  if (event.category?.memberFreeMonthly) return 'GATHERING_FREE';
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
      await this.prisma.membership.update({ where: { userId }, data: { status: 'EXPIRED' } });
      return { ...m, status: 'EXPIRED' as const };
    }
    return m;
  }

  async isActive(userId: string) {
    const m = await this.getMembership(userId);
    return !!m && m.status === 'ACTIVE';
  }

  /** 支付成功后开通/续费。 */
  async activate(userId: string) {
    const now = new Date();
    const existing = await this.prisma.membership.findUnique({ where: { userId } });
    const { expireAt, renewing } = computeRenewExpiry(existing, now);
    return this.prisma.membership.upsert({
      where: { userId },
      create: { userId, status: 'ACTIVE', startAt: now, expireAt },
      update: { status: 'ACTIVE', ...(renewing ? {} : { startAt: now }), expireAt },
    });
  }

  /** 价格计算：传入的 event 需 include category。 */
  async computePricing(event: any, userId?: string): Promise<Pricing> {
    const price = event.price as number;
    const isFreeEvent = price <= 0 || event.isPlanfExclusive;
    const member = userId ? await this.getMembership(userId) : null;
    const isMember = !!member && member.status === 'ACTIVE';

    if (isFreeEvent) {
      return { originalPrice: price, isMember, isFreeEvent: true, memberPrice: 0, finalPrice: 0, freeType: null, freeAvailable: false };
    }
    const memberPrice = Math.round(price * MEMBER_DISCOUNT);
    if (!isMember) {
      return { originalPrice: price, isMember: false, isFreeEvent: false, memberPrice, finalPrice: price, freeType: null, freeAvailable: false };
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
      finalPrice: freeAvailable ? 0 : memberPrice,
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
      gatheringFreeLeft: used.includes('GATHERING_FREE' as any) ? 0 : 1,
    };
  }
}
