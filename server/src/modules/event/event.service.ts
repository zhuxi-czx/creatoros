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
    if (userId) {
      const signup = await this.prisma.signup.findUnique({
        where: { userId_eventId: { userId, eventId: id } },
      });
      isSignedUp = !!signup && signup.status === 'CONFIRMED';
    }

    const pricing = await this.membership.computePricing(event, userId);
    return { ...event, isSignedUp, pricing };
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
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
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

    const event = await this.prisma.event.create({
      data: {
        ...dto,
        venueId,
        date: new Date(dto.date),
        price: dto.isPlanfExclusive ? 0 : (dto.price ?? 0), // 专享活动强制免费
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
    const [totalUsers, totalEvents, totalSignups, activeEvents, activeSignups] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.event.count(),
      this.prisma.signup.count({ where: { status: 'CONFIRMED' } }),
      this.prisma.event.count({ where: { status: { in: ['PUBLISHED', 'FULL', 'ONGOING'] } } }),
      this.prisma.signup.count({ where: { status: 'CONFIRMED' } }),
    ]);

    // Signups per day (last 14 days)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const recentSignups = await this.prisma.signup.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: fourteenDaysAgo } },
      _count: true,
    });

    // Top events by signups
    const topEvents = await this.prisma.event.findMany({
      take: 5,
      orderBy: { signups: { _count: 'desc' } },
      select: {
        id: true,
        title: true,
        date: true,
        status: true,
        maxCapacity: true,
        _count: { select: { signups: { where: { status: 'CONFIRMED' } } } },
      },
    });

    // Recent events
    const recentEvents = await this.prisma.event.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, title: true, date: true, status: true,
        _count: { select: { signups: { where: { status: 'CONFIRMED' } } } },
      },
    });

    return {
      totalUsers, totalEvents, totalSignups, activeEvents, activeSignups,
      topEvents, recentEvents,
    };
  }
}
