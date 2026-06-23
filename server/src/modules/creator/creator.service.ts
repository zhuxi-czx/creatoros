import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CreatorService {
  constructor(private prisma: PrismaService) {}

  /** 前台：主推 Creator 列表（按 order 升序，其次注册时间）。 */
  async listCreators() {
    const users = await this.prisma.user.findMany({
      where: { isCreator: true },
      include: {
        creatorProfile: true,
        _count: { select: { contents: { where: { status: 'PUBLISHED' } } } },
      },
    });
    return users
      .map((u) => this.shapeCard(u))
      .sort((a, b) => a.order - b.order || (a.createdAt < b.createdAt ? 1 : -1));
  }

  /** 前台：Creator 详情 + 其已发布内容列表。 */
  async getCreator(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { creatorProfile: true },
    });
    if (!user || !user.isCreator) throw new NotFoundException('Creator 不存在');

    const contents = await this.prisma.content.findMany({
      where: { creatorId: id, status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      select: { id: true, title: true, coverUrl: true, publishedAt: true },
    });

    const p = user.creatorProfile;
    return {
      id: user.id,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      title: p?.title ?? null,
      tagline: p?.tagline ?? null,
      intro: p?.intro ?? null,
      coverUrl: p?.coverUrl ?? user.avatarUrl ?? null,
      tags: p?.tags ?? [],
      contents,
    };
  }

  private shapeCard(u: any) {
    const p = u.creatorProfile;
    return {
      id: u.id,
      nickname: u.nickname,
      avatarUrl: u.avatarUrl,
      title: p?.title ?? null,
      tagline: p?.tagline ?? null,
      coverUrl: p?.coverUrl ?? u.avatarUrl ?? null,
      tags: p?.tags ?? [],
      contentCount: u._count?.contents ?? 0,
      order: p?.order ?? 0,
      createdAt: u.createdAt,
    };
  }
}
