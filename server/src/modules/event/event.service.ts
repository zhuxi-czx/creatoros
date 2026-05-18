import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { UpdateEventStatusDto } from './dto/update-event-status.dto';

@Injectable()
export class EventService {
  constructor(private prisma: PrismaService) {}

  // Public endpoints
  async getPublishedEvents(page: number = 1, limit: number = 20, city?: string) {
    const skip = (page - 1) * limit;

    const where: any = {
      status: { in: ['PUBLISHED', 'FULL', 'ONGOING'] },
    };

    if (city) {
      where.venue = { city: { contains: city, mode: 'insensitive' } };
    }

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'asc' },
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

  async getFeaturedEvents() {
    const events = await this.prisma.event.findMany({
      where: {
        featured: true,
        status: { in: ['PUBLISHED', 'FULL', 'ONGOING'] },
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

    return { ...event, isSignedUp };
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
        orderBy: { createdAt: 'desc' },
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
        price: dto.price ?? 0,
        featured: dto.featured ?? false,
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

  async adminGetStats() {
    const [
      totalUsers,
      totalEvents,
      totalSignups,
      activeEvents,
      activeSignups,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.event.count(),
      this.prisma.signup.count(),
      this.prisma.event.count({
        where: { status: { in: ['PUBLISHED', 'FULL', 'ONGOING'] } },
      }),
      this.prisma.signup.count({ where: { status: 'CONFIRMED' } }),
    ]);

    const recentEvents = await this.prisma.event.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        date: true,
        status: true,
        _count: {
          select: { signups: { where: { status: 'CONFIRMED' } } },
        },
      },
    });

    return {
      totalUsers,
      totalEvents,
      totalSignups,
      activeEvents,
      activeSignups,
      recentEvents,
    };
  }
}
