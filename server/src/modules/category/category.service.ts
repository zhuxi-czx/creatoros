import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpsertCategoryDto } from './dto/upsert-category.dto';
import { LIVE_STATUS, EVENT_CARD_INCLUDE } from '../../common/event-card';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  // ===== 前台 =====

  /** 发现页顶部分类标签。 */
  async listForApp() {
    const cats = await this.prisma.category.findMany({ orderBy: { order: 'asc' } });
    return cats.map((c) => ({ id: c.id, name: c.name, icon: c.icon }));
  }

  /** 分类页：分类信息 + 该分类活动（开始时间倒序）。 */
  async getCategoryPage(id: string) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('分类不存在');
    const events = await this.prisma.event.findMany({
      where: { categoryId: id, status: { in: LIVE_STATUS as any } },
      orderBy: { date: 'desc' },
      include: EVENT_CARD_INCLUDE,
    });
    return {
      id: cat.id,
      name: cat.name,
      intro: cat.intro,
      coverUrl: cat.coverUrl,
      icon: cat.icon,
      events,
    };
  }

  // ===== 后台 =====

  async adminList() {
    return this.prisma.category.findMany({
      orderBy: { order: 'asc' },
      include: { _count: { select: { events: true } } },
    });
  }

  async adminCreate(dto: UpsertCategoryDto) {
    return this.prisma.category.create({ data: { ...dto } });
  }

  async adminUpdate(id: string, dto: UpsertCategoryDto) {
    const exist = await this.prisma.category.findUnique({ where: { id } });
    if (!exist) throw new NotFoundException('分类不存在');
    return this.prisma.category.update({ where: { id }, data: { ...dto } });
  }

  /** 删除分类：先把关联活动的 categoryId 置空，再删。 */
  async adminRemove(id: string) {
    await this.prisma.event.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    });
    await this.prisma.category.delete({ where: { id } });
    return { success: true };
  }

  /** 活动表单「快速新建分类」：仅填名称，介绍/封面后补。 */
  async quickCreate(name: string) {
    const agg = await this.prisma.category.aggregate({ _max: { order: true } });
    return this.prisma.category.create({
      data: { name, order: (agg._max.order ?? 0) + 1 },
    });
  }
}
