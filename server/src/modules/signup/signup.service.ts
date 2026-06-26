import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderService } from '../payment/order.service';

@Injectable()
export class SignupService {
  constructor(
    private prisma: PrismaService,
    private orderService: OrderService,
  ) {}

  async signupForEvent(userId: string, eventId: string) {
    return this.prisma.$transaction(async (tx) => {
      // 行锁：序列化并发报名，防「读 count → 判断 → 插入」超卖
      await tx.$queryRaw`SELECT id FROM "Event" WHERE id = ${eventId} FOR UPDATE`;
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

    // 已支付报名：取消即触发原路退款（退款流程内部会取消报名 + 释放名额 + FULL→PUBLISHED）
    if (signup.order && signup.order.status === 'PAID') {
      const r = await this.orderService.refundSignup(signup.id, {
        reason: '用户取消报名',
      });
      return { success: true, refunded: true, refundStatus: r.status };
    }
    // 退款处理中：不允许重复操作
    if (signup.order && signup.order.status === 'REFUNDING') {
      throw new BadRequestException('退款处理中，请稍后查看');
    }

    // 免费/未支付：直接取消 + 退还会员免费名额（同事务，保证原子）
    await this.prisma.$transaction(async (tx) => {
      await tx.signup.update({
        where: { id: signup.id },
        data: { status: 'CANCELLED' },
      });
      // 退还本次消耗的会员免费名额（会员免费名额报名 orderId 为 null，走此路径）
      const m = await tx.membership.findUnique({ where: { userId } });
      if (m) {
        await tx.membershipBenefitUsage.deleteMany({
          where: { membershipId: m.id, eventId },
        });
      }
      // If event was FULL, reopen it to PUBLISHED
      if (event.status === 'FULL') {
        await tx.event.update({
          where: { id: eventId },
          data: { status: 'PUBLISHED' },
        });
      }
    });

    return { success: true, refunded: false };
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
