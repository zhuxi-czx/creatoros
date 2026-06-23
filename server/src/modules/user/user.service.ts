import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    // 拆出 Creator 资料字段，其余为普通用户字段
    const {
      creatorTitle,
      creatorTagline,
      creatorIntro,
      creatorCoverUrl,
      creatorTags,
      ...userData
    } = dto;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: userData,
    });

    // 仅 Creator 用户写入/更新 CreatorProfile（本人编辑资料）
    let creatorProfile: any = null;
    if (user.isCreator) {
      const hasCreatorField =
        creatorTitle !== undefined ||
        creatorTagline !== undefined ||
        creatorIntro !== undefined ||
        creatorCoverUrl !== undefined ||
        creatorTags !== undefined;
      if (hasCreatorField) {
        const data: any = {};
        if (creatorTitle !== undefined) data.title = creatorTitle;
        if (creatorTagline !== undefined) data.tagline = creatorTagline;
        if (creatorIntro !== undefined) data.intro = creatorIntro;
        if (creatorCoverUrl !== undefined) data.coverUrl = creatorCoverUrl;
        if (creatorTags !== undefined) data.tags = creatorTags;
        creatorProfile = await this.prisma.creatorProfile.upsert({
          where: { userId },
          create: { userId, ...data },
          update: data,
        });
      } else {
        creatorProfile = await this.prisma.creatorProfile.findUnique({
          where: { userId },
        });
      }
    }

    return { ...this.sanitizeUser(user), creatorProfile };
  }

  /** 管理员设置/取消某用户为 Creator；开启时确保有资料行。 */
  async adminSetCreator(id: string, isCreator: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isCreator },
    });
    if (isCreator) {
      await this.prisma.creatorProfile.upsert({
        where: { userId: id },
        create: { userId: id },
        update: {},
      });
    }
    return this.sanitizeUser(updated);
  }

  async getPublicProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        nickname: true,
        avatarUrl: true,
        city: true,
        bio: true,
        gender: true,
        mbti: true,
        zodiac: true,
        generation: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getMySignups(userId: string) {
    const signups = await this.prisma.signup.findMany({
      where: {
        userId,
        status: 'CONFIRMED',
      },
      include: {
        event: {
          include: {
            venue: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return signups;
  }

  // Admin methods
  async adminListUsers(page: number = 1, limit: number = 20, search?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { nickname: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          uid: true,
          nickname: true,
          avatarUrl: true,
          phone: true,
          role: true,
          status: true,
          isCreator: true,
          city: true,
          createdAt: true,
          _count: {
            select: { signups: true },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async adminGetUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: { signups: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async adminUpdateUserStatus(id: string, dto: UpdateUserStatusDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'ADMIN') {
      throw new ForbiddenException('Cannot change admin status');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: dto.status },
    });

    return this.sanitizeUser(updated);
  }

  private sanitizeUser(user: any) {
    const { openId, unionId, ...rest } = user;
    return rest;
  }
}
