import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVenueDto } from './dto/create-venue.dto';

@Injectable()
export class VenueService {
  constructor(private prisma: PrismaService) {}

  async getVenueById(id: string) {
    const venue = await this.prisma.venue.findUnique({
      where: { id },
      include: {
        _count: {
          select: { events: true },
        },
      },
    });

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    return venue;
  }

  async createVenue(dto: CreateVenueDto) {
    return this.prisma.venue.create({ data: dto });
  }

  async getAllVenues() {
    return this.prisma.venue.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { events: true },
        },
      },
    });
  }

  async getVenueEvents(
    id: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const venue = await this.prisma.venue.findUnique({ where: { id } });
    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where: {
          venueId: id,
          status: { in: ['PUBLISHED', 'FULL', 'ONGOING', 'ENDED'] },
        },
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          _count: {
            select: { signups: { where: { status: 'CONFIRMED' } } },
          },
        },
      }),
      this.prisma.event.count({
        where: {
          venueId: id,
          status: { in: ['PUBLISHED', 'FULL', 'ONGOING', 'ENDED'] },
        },
      }),
    ]);

    return {
      venue,
      data: events,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
