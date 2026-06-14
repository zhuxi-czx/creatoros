import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SignupService {
  constructor(private prisma: PrismaService) {}

  async signupForEvent(userId: string, eventId: string) {
    return this.prisma.$transaction(async (tx) => {
      // Check event exists and is published
      const event = await tx.event.findUnique({
        where: { id: eventId },
        include: {
          _count: {
            select: { signups: { where: { status: 'CONFIRMED' } } },
          },
        },
      });

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      if (event.status !== 'PUBLISHED') {
        if (event.status === 'FULL') {
          throw new BadRequestException('Event is full');
        }
        throw new BadRequestException(`Cannot sign up for event with status: ${event.status}`);
      }

      // 付费活动必须走支付下单（checkout），免费报名接口不得绕过支付
      if (event.price > 0) {
        throw new BadRequestException('该活动需支付报名，请通过支付完成报名');
      }

      // Check if already signed up
      const existingSignup = await tx.signup.findUnique({
        where: {
          userId_eventId: {
            userId,
            eventId,
          },
        },
      });

      if (existingSignup) {
        if (existingSignup.status === 'CONFIRMED') {
          throw new ConflictException('Already signed up for this event');
        }

        // Re-activate a cancelled signup
        const confirmedCount = event._count.signups;
        if (confirmedCount >= event.maxCapacity) {
          throw new BadRequestException('Event is full');
        }

        const signup = await tx.signup.update({
          where: { id: existingSignup.id },
          data: { status: 'CONFIRMED' },
        });

        // Check if event is now full and update status
        const newCount = await tx.signup.count({
          where: { eventId, status: 'CONFIRMED' },
        });
        if (newCount >= event.maxCapacity) {
          await tx.event.update({
            where: { id: eventId },
            data: { status: 'FULL' },
          });
        }

        return signup;
      }

      // Check capacity
      const confirmedCount = event._count.signups;
      if (confirmedCount >= event.maxCapacity) {
        // Update event status to FULL
        await tx.event.update({
          where: { id: eventId },
          data: { status: 'FULL' },
        });
        throw new BadRequestException('Event is full');
      }

      // Create signup
      const signup = await tx.signup.create({
        data: {
          userId,
          eventId,
          status: 'CONFIRMED',
        },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              date: true,
            },
          },
        },
      });

      // Check if event is now full and update status
      const newCount = await tx.signup.count({
        where: { eventId, status: 'CONFIRMED' },
      });
      if (newCount >= event.maxCapacity) {
        await tx.event.update({
          where: { id: eventId },
          data: { status: 'FULL' },
        });
      }

      return signup;
    });
  }

  async cancelSignup(userId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const signup = await this.prisma.signup.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      include: { order: true },
    });

    if (!signup || signup.status === 'CANCELLED') {
      throw new NotFoundException('Signup not found');
    }

    // 已支付报名不允许用户自助取消（退款仅由后台操作，避免取消后款项滞留）
    if (signup.order && ['PAID', 'REFUNDING'].includes(signup.order.status)) {
      throw new BadRequestException('已支付的报名，请联系主理人在后台办理退款取消');
    }

    const cancelled = await this.prisma.signup.update({
      where: { id: signup.id },
      data: { status: 'CANCELLED' },
    });

    // If event was FULL, reopen it to PUBLISHED
    if (event.status === 'FULL') {
      await this.prisma.event.update({
        where: { id: eventId },
        data: { status: 'PUBLISHED' },
      });
    }

    return cancelled;
  }

  private async checkAndUpdateEventCapacity(
    eventId: string,
    maxCapacity: number,
  ) {
    const confirmedCount = await this.prisma.signup.count({
      where: {
        eventId,
        status: 'CONFIRMED',
      },
    });

    if (confirmedCount >= maxCapacity) {
      await this.prisma.event.update({
        where: { id: eventId },
        data: { status: 'FULL' },
      });
    }
  }
}
