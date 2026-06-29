import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { UpdateEventStatusDto } from './dto/update-event-status.dto';
import { MembershipService } from '../membership/membership.service';

@Injectable()
export class EventService {
  constructor(
    private prisma: PrismaService,
    private membership: MembershipService,
  ) {}

  // Public endpoints
  async getPublishedEvents(
    page: number = 1,
    limit: number = 20,
    city?: string,
    keyword?: string,
    userId?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {
      // 上架即展示（含已结束 ENDED）；下架为 CANCELLED、草稿为 DRAFT 才隐藏
      status: { in: ['PUBLISHED', 'FULL', 'ONGOING', 'ENDED'] },
    };

    if (city) {
      where.venue = { city: { contains: city, mode: 'insensitive' } };
    }

    // 全字段搜索：标题/描述/亮点/流程/须知/发起人/大咖名 + 场地名地址城市
    const kw = keyword?.trim();
    if (kw) {
      where.OR = [
        { title: { contains: kw, mode: 'insensitive' } },
        { description: { contains: kw, mode: 'insensitive' } },
        { highlights: { contains: kw, mode: 'insensitive' } },
        { schedule: { contains: kw, mode: 'insensitive' } },
        { notes: { contains: kw, mode: 'insensitive' } },
        { hostName: { contains: kw, mode: 'insensitive' } },
        { guestName: { contains: kw, mode: 'insensitive' } },
        { venue: { name: { contains: kw, mode: 'insensitive' } } },
        { venue: { city: { contains: kw, mode: 'insensitive' } } },
        { venue: { address: { contains: kw, mode: 'insensitive' } } },
      ];
    }

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          venue: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
            },
          },
          signups: {
            where: { status: 'CONFIRMED' },
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { user: { select: { id: true, avatarUrl: true } } },
          },
          _count: {
            select: { signups: { where: { status: 'CONFIRMED' } } },
          },
        },
      }),
      this.prisma.event.count({ where }),
    ]);

    // 标记当前用户是否已报名（卡片据此对「已结束且未参与」显示「欢迎下次参与」）
    let data: any[] = events;
    if (userId && events.length) {
      const mine = await this.prisma.signup.findMany({
        where: {
          userId,
          eventId: { in: events.map((e) => e.id) },
          status: 'CONFIRMED',
        },
        select: { eventId: true },
      });
      const joined = new Set(mine.map((s) => s.eventId));
      data = events.map((e) => ({ ...e, isSignedUp: joined.has(e.id) }));
    }

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFeaturedEvents() {
    const events = await this.prisma.event.findMany({
      where: {
        featured: true,
        status: { in: ['PUBLISHED', 'FULL', 'ONGOING', 'ENDED'] },
      },
      orderBy: { date: 'asc' },
      take: 10,
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
        _count: {
          select: { signups: { where: { status: 'CONFIRMED' } } },
        },
      },
    });

    return events;
  }

  async getEventById(id: string, userId?: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        venue: true,
        category: true,
        _count: {
          select: { signups: { where: { status: 'CONFIRMED' } } },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (!['PUBLISHED', 'FULL', 'ONGOING', 'ENDED'].includes(event.status)) {
      throw new NotFoundException('Event not found');
    }

    let isSignedUp = false;
    let mySignup: { paidAmount: number; freeBenefit: 'GUEST_FREE' | null } | null = null;
    if (userId) {
      const signup = await this.prisma.signup.findUnique({
        where: { userId_eventId: { userId, eventId: id } },
        include: { order: true },
      });
      if (signup && signup.status === 'CONFIRMED') {
        isSignedUp = true;
        // 实付金额（会员免费名额 / 免费活动报名无订单或金额为 0）
        const paidAmount = signup.order && signup.order.status === 'PAID' ? signup.order.amount : 0;
        // 是否用了 PlanF 会员「大咖每月一次免费」名额（免费报名 + 大咖活动）
        const freeBenefit: 'GUEST_FREE' | null = !signup.orderId && (event as any).isGuestShare ? 'GUEST_FREE' : null;
        mySignup = { paidAmount, freeBenefit };
      }
    }

    const pricing = await this.membership.computePricing(event, userId);
    return { ...event, isSignedUp, mySignup, pricing };
  }

  async getEventSignups(id: string) {
    const signups = await this.prisma.signup.findMany({
      where: { eventId: id, status: 'CONFIRMED' },
      include: {
        user: {
          select: { id: true, nickname: true, avatarUrl: true, city: true },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
    return signups.map(s => s.user);
  }

  // Admin endpoints
  async adminGetEventById(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        venue: true,
        _count: {
          select: { signups: { where: { status: 'CONFIRMED' } } },
        },
      },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  async adminGetEventSignups(id: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;
    const [signups, total] = await Promise.all([
      this.prisma.signup.findMany({
        where: { eventId: id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true, uid: true, nickname: true, avatarUrl: true,
              city: true, phone: true, mbti: true, createdAt: true,
              membership: { select: { status: true, expireAt: true } },
            },
          },
          order: {
            select: { id: true, status: true, amount: true, refundedAt: true },
          },
        },
      }),
      this.prisma.signup.count({ where: { eventId: id } }),
    ]);
    return { data: signups, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async adminGetEvents(
    page: number = 1,
    limit: number = 20,
    status?: string,
    search?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    const kw = search?.trim();
    if (kw) {
      where.title = { contains: kw, mode: 'insensitive' }; // 仅按活动名称搜索
    }

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' }, // 按活动时间倒序（最新/最近活动在前）
        include: {
          venue: {
            select: {
              id: true,
              name: true,
              city: true,
            },
          },
          _count: {
            select: { signups: { where: { status: 'CONFIRMED' } } },
          },
        },
      }),
      this.prisma.event.count({ where }),
    ]);

    return {
      data: events,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async adminCreateEvent(dto: CreateEventDto) {
    let venueId = dto.venueId;

    // If venueId is 'default' or empty, find or create the default venue
    if (!venueId || venueId === 'default') {
      const defaultVenueName = '敞开酒馆 Often Bar';
      let defaultVenue = await this.prisma.venue.findFirst({
        where: { name: defaultVenueName },
      });
      if (!defaultVenue) {
        defaultVenue = await this.prisma.venue.create({
          data: {
            name: defaultVenueName,
            city: '杭州',
            address: '浙江杭州',
          },
        });
      }
      venueId = defaultVenue.id;
    } else {
      // Verify venue exists
      const venue = await this.prisma.venue.findUnique({
        where: { id: venueId },
      });
      if (!venue) {
        throw new BadRequestException('Venue not found');
      }
    }

    const finalPrice = dto.isPlanfExclusive ? 0 : (dto.price ?? 0);
    // 早鸟价：仅付费活动、且价格与名额同时配置时生效，否则清空
    const ebOk = finalPrice > 0 && !!dto.earlyBirdPrice && !!dto.earlyBirdQuota;
    if (ebOk) {
      const memberPrice = Math.round(finalPrice * 0.8);
      if (dto.earlyBirdPrice! >= finalPrice) throw new BadRequestException('早鸟价需低于原价');
      if (dto.earlyBirdPrice! <= memberPrice) throw new BadRequestException('早鸟价需高于会员价（原价 8 折）');
    }
    const event = await this.prisma.event.create({
      data: {
        ...dto,
        venueId,
        date: new Date(dto.date),
        price: finalPrice, // 专享活动强制免费
        earlyBirdPrice: ebOk ? dto.earlyBirdPrice : null,
        earlyBirdQuota: ebOk ? dto.earlyBirdQuota : null,
        featured: dto.featured ?? false,
        imageUrls: dto.imageUrls ?? [],
        autoplay: dto.autoplay ?? true,
        interval: dto.interval ?? 3000,
      },
      include: {
        venue: true,
      },
    });

    return event;
  }

  async adminUpdateEvent(id: string, dto: UpdateEventDto) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (dto.venueId) {
      const venue = await this.prisma.venue.findUnique({
        where: { id: dto.venueId },
      });
      if (!venue) {
        throw new BadRequestException('Venue not found');
      }
    }

    const updateData: any = { ...dto };
    if (dto.date) {
      updateData.date = new Date(dto.date);
    }
    if (dto.isPlanfExclusive) updateData.price = 0; // 专享活动强制免费
    // 早鸟价：以最终生效价为准，专享/免费 或 价格名额未同时配置 → 清空
    const effPrice = updateData.price ?? event.price;
    const ebPrice = updateData.earlyBirdPrice ?? event.earlyBirdPrice;
    const ebQuota = updateData.earlyBirdQuota ?? event.earlyBirdQuota;
    if (!(effPrice > 0 && ebPrice && ebQuota)) {
      updateData.earlyBirdPrice = null;
      updateData.earlyBirdQuota = null;
    } else {
      const memberPrice = Math.round(effPrice * 0.8);
      if (ebPrice >= effPrice) throw new BadRequestException('早鸟价需低于原价');
      if (ebPrice <= memberPrice) throw new BadRequestException('早鸟价需高于会员价（原价 8 折）');
    }

    const updated = await this.prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        venue: true,
        _count: {
          select: { signups: { where: { status: 'CONFIRMED' } } },
        },
      },
    });

    return updated;
  }

  async adminUpdateEventStatus(id: string, dto: UpdateEventStatusDto) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const updated = await this.prisma.event.update({
      where: { id },
      data: { status: dto.status },
    });

    return updated;
  }

  // 删除活动：仅「已下架(CANCELLED) + 已结束」可删，级联删除订单/报名
  async adminDeleteEvent(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    if (event.status !== 'CANCELLED') {
      throw new BadRequestException('请先下架该活动再删除');
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.order.deleteMany({ where: { eventId: id } });
      await tx.signup.deleteMany({ where: { eventId: id } });
      await tx.event.delete({ where: { id } });
    });
    return { success: true };
  }

  /** 后台手动添加报名成员（免费、状态 CONFIRMED）。 */
  async adminAddSignup(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('活动不存在');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');
    const exist = await this.prisma.signup.findFirst({ where: { eventId, userId } });
    if (exist) {
      if (exist.status === 'CONFIRMED') throw new BadRequestException('该用户已报名');
      return this.prisma.signup.update({ where: { id: exist.id }, data: { status: 'CONFIRMED' } });
    }
    return this.prisma.signup.create({ data: { eventId, userId, status: 'CONFIRMED' } });
  }

  async adminCopyEvent(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');

    const { id: _, createdAt, updatedAt, status, ...data } = event;
    return this.prisma.event.create({
      data: {
        ...data,
        title: data.title + ' (副本)',
        status: 'DRAFT',
      },
      include: { venue: true },
    });
  }

  async adminGetStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
    const trendStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13);
    const in24h = new Date(now.getTime() + 24 * 3600 * 1000);
    const in7d = new Date(now); in7d.setDate(now.getDate() + 7);

    const [
      totalUsers, totalEvents, totalSignups, activeEvents,
      topEvents, recentEvents,
      revTotal, revMonth, revToday, revEvent, revMember, revRefund,
      orderGroups,
      activeMembers, newMembersMonth, expiringSoon,
      newUsersToday, newUsersWeek,
      refundPending, todayErrors, upcomingEvents, paidEventOrders,
      revLastMonth, revYesterday,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.event.count(),
      this.prisma.signup.count({ where: { status: 'CONFIRMED' } }),
      this.prisma.event.count({ where: { status: { in: ['PUBLISHED', 'FULL', 'ONGOING'] } } }),
      this.prisma.event.findMany({ take: 5, orderBy: { signups: { _count: 'desc' } }, select: { id: true, title: true, date: true, status: true, maxCapacity: true, _count: { select: { signups: { where: { status: 'CONFIRMED' } } } } } }),
      this.prisma.event.findMany({ take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, title: true, date: true, status: true, maxCapacity: true, _count: { select: { signups: { where: { status: 'CONFIRMED' } } } } } }),
      this.prisma.order.aggregate({ _sum: { amount: true }, where: { status: 'PAID' } }),
      this.prisma.order.aggregate({ _sum: { amount: true }, where: { status: 'PAID', paidAt: { gte: monthStart } } }),
      this.prisma.order.aggregate({ _sum: { amount: true }, where: { status: 'PAID', paidAt: { gte: todayStart } } }),
      this.prisma.order.aggregate({ _sum: { amount: true }, where: { status: 'PAID', type: 'EVENT' } }),
      this.prisma.order.aggregate({ _sum: { amount: true }, where: { status: 'PAID', type: 'MEMBERSHIP' } }),
      this.prisma.order.aggregate({ _sum: { amount: true }, where: { status: 'REFUNDED' } }),
      this.prisma.order.groupBy({ by: ['status'], _count: true }),
      this.prisma.membership.count({ where: { status: 'ACTIVE', expireAt: { gt: now } } }),
      this.prisma.membership.count({ where: { createdAt: { gte: monthStart } } }),
      this.prisma.membership.findMany({ where: { status: 'ACTIVE', expireAt: { gt: now, lte: in7d } }, orderBy: { expireAt: 'asc' }, take: 20, include: { user: { select: { nickname: true, uid: true } } } }),
      this.prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      this.prisma.order.count({ where: { status: 'REFUNDING' } }),
      this.prisma.systemLog.count({ where: { level: { in: ['ERROR', 'WARN'] }, createdAt: { gte: todayStart } } }),
      this.prisma.event.findMany({ where: { status: { in: ['PUBLISHED', 'FULL'] }, date: { gt: now, lte: in24h } }, orderBy: { date: 'asc' }, take: 10, select: { id: true, title: true, date: true, maxCapacity: true, _count: { select: { signups: { where: { status: 'CONFIRMED' } } } } } }),
      this.prisma.order.count({ where: { status: 'PAID', type: 'EVENT' } }),
      this.prisma.order.aggregate({ _sum: { amount: true }, where: { status: 'PAID', paidAt: { gte: lastMonthStart, lt: monthStart } } }),
      this.prisma.order.aggregate({ _sum: { amount: true }, where: { status: 'PAID', paidAt: { gte: yesterdayStart, lt: todayStart } } }),
    ]);

    // 趋势 + 分布（原生 SQL 按日聚合）
    const [signupRows, revenueRows, userRows, statusRows, strategyRows]: any[] = await Promise.all([
      this.prisma.$queryRaw`SELECT to_char("createdAt"::date,'YYYY-MM-DD') d, count(*)::int c FROM "Signup" WHERE status='CONFIRMED' AND "createdAt" >= ${trendStart} GROUP BY 1`,
      this.prisma.$queryRaw`SELECT to_char("paidAt"::date,'YYYY-MM-DD') d, sum(amount)::int c FROM "Order" WHERE status='PAID' AND "paidAt" >= ${trendStart} GROUP BY 1`,
      this.prisma.$queryRaw`SELECT to_char("createdAt"::date,'YYYY-MM-DD') d, count(*)::int c FROM "User" WHERE "createdAt" >= ${trendStart} GROUP BY 1`,
      this.prisma.$queryRaw`SELECT unnest(statuses) status, count(*)::int c FROM "User" WHERE array_length(statuses,1) > 0 GROUP BY 1 ORDER BY c DESC`,
      this.prisma.$queryRaw`SELECT CASE WHEN e."earlyBirdPrice" IS NOT NULL AND o.amount=e."earlyBirdPrice" THEN 'earlyBird' WHEN o.amount=e.price THEN 'original' WHEN o.amount=round(e.price*0.8) THEN 'member' ELSE 'other' END strategy, count(*)::int c FROM "Order" o JOIN "Event" e ON o."eventId"=e.id WHERE o.type='EVENT' AND o.status='PAID' GROUP BY 1`,
    ]);

    const fillTrend = (rows: any[]) => {
      const map = new Map(rows.map((r) => [r.d, Number(r.c)]));
      const out: { date: string; value: number }[] = [];
      for (let i = 0; i < 14; i++) {
        const dt = new Date(trendStart); dt.setDate(trendStart.getDate() + i);
        const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
        out.push({ date: key, value: map.get(key) ?? 0 });
      }
      return out;
    };

    const orderCountMap: Record<string, number> = {};
    for (const g of orderGroups as any[]) orderCountMap[g.status] = (g as any)._count;
    const fen = (a: any) => Number(a?._sum?.amount || 0);

    const strategy: Record<string, number> = { free: 0, earlyBird: 0, original: 0, member: 0, other: 0 };
    for (const r of strategyRows) strategy[r.strategy] = Number(r.c);
    strategy.free = Math.max(0, totalSignups - Number(paidEventOrders));

    return {
      totalUsers, totalEvents, totalSignups, activeEvents, activeSignups: totalSignups,
      topEvents, recentEvents,
      revenue: {
        total: fen(revTotal), month: fen(revMonth), today: fen(revToday),
        lastMonth: fen(revLastMonth), yesterday: fen(revYesterday),
        event: fen(revEvent), member: fen(revMember), refund: fen(revRefund),
        orders: { paid: orderCountMap['PAID'] || 0, pending: orderCountMap['PENDING'] || 0, refunded: orderCountMap['REFUNDED'] || 0 },
      },
      priceStrategy: strategy,
      members: {
        active: activeMembers, newThisMonth: newMembersMonth,
        penetration: totalUsers ? Math.round((activeMembers / totalUsers) * 1000) / 10 : 0,
        expiringSoon: (expiringSoon as any[]).map((m) => ({ nickname: m.user?.nickname, uid: m.user?.uid, expireAt: m.expireAt })),
      },
      trend: { signups: fillTrend(signupRows), revenue: fillTrend(revenueRows), users: fillTrend(userRows) },
      newUsersToday, newUsersWeek,
      statusDist: statusRows.map((r: any) => ({ status: r.status, count: Number(r.c) })),
      alerts: {
        refundPending, todayErrors,
        upcomingEvents: (upcomingEvents as any[]).map((e) => ({ id: e.id, title: e.title, date: e.date, signups: e._count?.signups || 0, maxCapacity: e.maxCapacity })),
      },
    };
  }
}
