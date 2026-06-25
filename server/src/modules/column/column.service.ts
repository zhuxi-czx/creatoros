import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LIVE_STATUS, EVENT_CARD_INCLUDE } from '../../common/event-card';

// 三个固定专栏的活动筛选条件
const COLUMN_FILTER: Record<string, any> = {
  FEATURED: { featured: true },
  PLANF: { isPlanfExclusive: true },
  GUEST: { isGuestShare: true },
};

// 种子默认（首次访问自动建）
const COLUMN_DEFAULTS = [
  { type: 'FEATURED', title: '社区精选', intro: '由编辑团队精挑细选，每一场都值得你专程赴约。', icon: 'sparkles' },
  { type: 'PLANF', title: 'PlanF 专享', intro: 'PlanF 会员专属活动，免费畅享，名额优先。', icon: 'crown' },
  { type: 'GUEST', title: '大咖分享', intro: '邀请各领域大咖来到现场，与你面对面分享真实的经验与故事。', icon: 'star' },
];

@Injectable()
export class ColumnService {
  constructor(private prisma: PrismaService) {}

  private seeded = false;

  /** 确保 3 条专栏配置存在（进程内只跑一次）。 */
  private async ensureSeed() {
    if (this.seeded) return;
    for (const d of COLUMN_DEFAULTS) {
      await this.prisma.columnConfig.upsert({
        where: { type: d.type as any },
        create: d as any,
        update: {},
      });
    }
    this.seeded = true;
  }

  // ===== 前台 =====

  /** 发现页 3 个专栏卡配置。 */
  async listForApp() {
    await this.ensureSeed();
    return this.prisma.columnConfig.findMany();
  }

  /** 专栏页：配置 + 该专栏活动（开始时间倒序）。 */
  async getColumnPage(type: string) {
    const filter = COLUMN_FILTER[type];
    if (!filter) throw new BadRequestException('未知专栏');
    await this.ensureSeed();
    const config = await this.prisma.columnConfig.findUnique({ where: { type: type as any } });
    const events = await this.prisma.event.findMany({
      where: { ...filter, status: { in: LIVE_STATUS as any } },
      orderBy: { date: 'desc' },
      include: EVENT_CARD_INCLUDE,
    });
    return { config, events };
  }

  // ===== 后台 =====

  async adminList() {
    await this.ensureSeed();
    return this.prisma.columnConfig.findMany();
  }

  async adminUpdate(
    type: string,
    dto: { title?: string; intro?: string; icon?: string; bgUrl?: string },
  ) {
    if (!COLUMN_FILTER[type]) throw new BadRequestException('未知专栏');
    await this.ensureSeed();
    return this.prisma.columnConfig.update({ where: { type: type as any }, data: { ...dto } });
  }
}
