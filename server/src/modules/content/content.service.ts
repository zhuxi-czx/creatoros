import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpsertContentDto } from './dto/upsert-content.dto';

@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService) {}

  // ===== 前台 =====

  /** 已发布内容列表（敞开对谈，发布时间倒序）。 */
  async listPublished() {
    const items = await this.prisma.content.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        coverUrl: true,
        publishedAt: true,
        creator: {
          select: {
            id: true,
            nickname: true,
            creatorProfile: { select: { title: true } },
          },
        },
      },
    });
    return items.map((c) => this.shapeListItem(c));
  }

  /** 内容详情（含富文本正文 + 对谈对象信息）。 */
  async getPublished(id: string) {
    const c = await this.prisma.content.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
            creatorProfile: { select: { title: true } },
          },
        },
      },
    });
    if (!c || c.status !== 'PUBLISHED') {
      throw new NotFoundException('内容不存在');
    }
    return {
      id: c.id,
      title: c.title,
      body: c.body,
      coverUrl: c.coverUrl,
      publishedAt: c.publishedAt,
      creator: {
        id: c.creator.id,
        nickname: c.creator.nickname,
        avatarUrl: c.creator.avatarUrl,
        title: c.creator.creatorProfile?.title ?? null,
      },
    };
  }

  // ===== 后台 =====

  async adminList() {
    const items = await this.prisma.content.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            nickname: true,
            creatorProfile: { select: { title: true } },
          },
        },
      },
    });
    return items.map((c) => ({
      id: c.id,
      title: c.title,
      coverUrl: c.coverUrl,
      status: c.status,
      publishedAt: c.publishedAt,
      createdAt: c.createdAt,
      creator: {
        id: c.creator.id,
        nickname: c.creator.nickname,
        title: c.creator.creatorProfile?.title ?? null,
      },
    }));
  }

  async adminGet(id: string) {
    const c = await this.prisma.content.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('内容不存在');
    return c;
  }

  async adminCreate(dto: UpsertContentDto) {
    await this.assertCreator(dto.creatorId);
    const status = dto.status ?? 'DRAFT';
    return this.prisma.content.create({
      data: {
        title: dto.title,
        body: dto.body,
        coverUrl: dto.coverUrl ?? null,
        creatorId: dto.creatorId,
        status,
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
      },
    });
  }

  async adminUpdate(id: string, dto: UpsertContentDto) {
    const existing = await this.prisma.content.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('内容不存在');
    await this.assertCreator(dto.creatorId);

    const status = dto.status ?? existing.status;
    // 首次发布时补 publishedAt；从发布改回草稿则清空
    let publishedAt = existing.publishedAt;
    if (status === 'PUBLISHED' && !existing.publishedAt) publishedAt = new Date();
    if (status === 'DRAFT') publishedAt = null;

    return this.prisma.content.update({
      where: { id },
      data: {
        title: dto.title,
        body: dto.body,
        coverUrl: dto.coverUrl ?? null,
        creatorId: dto.creatorId,
        status,
        publishedAt,
      },
    });
  }

  async adminRemove(id: string) {
    const existing = await this.prisma.content.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('内容不存在');
    await this.prisma.content.delete({ where: { id } });
    return { success: true };
  }

  private async assertCreator(creatorId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: creatorId } });
    if (!user) throw new BadRequestException('关联的 Creator 不存在');
    if (!user.isCreator) throw new BadRequestException('关联用户不是 Creator');
  }

  private shapeListItem(c: any) {
    return {
      id: c.id,
      title: c.title,
      coverUrl: c.coverUrl,
      publishedAt: c.publishedAt,
      creator: {
        id: c.creator.id,
        nickname: c.creator.nickname,
        title: c.creator.creatorProfile?.title ?? null,
      },
    };
  }
}
