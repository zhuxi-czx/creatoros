import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LogService {
  constructor(private prisma: PrismaService) {}

  /** 记录一条系统日志；写库失败不抛，避免影响主流程 */
  async record(
    level: 'ERROR' | 'WARN',
    source: string,
    message: string,
    detail?: string,
    path?: string,
  ) {
    try {
      await this.prisma.systemLog.create({
        data: {
          level,
          source,
          message: (message || '').slice(0, 500),
          detail: detail ? detail.slice(0, 2000) : null,
          path: path || null,
        },
      });
    } catch {
      // 记录失败忽略
    }
  }

  /** 分页查询日志（可按 level / source / 某天过滤） */
  async list(params: {
    page?: number;
    limit?: number;
    level?: string;
    source?: string;
    date?: string;
  }) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = Math.min(params.limit || 30, 100);
    const where: any = {};
    if (params.level) where.level = params.level;
    if (params.source) where.source = params.source;
    if (params.date) {
      const d = new Date(params.date);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const end = new Date(start.getTime() + 86400000);
      where.createdAt = { gte: start, lt: end };
    }
    const [data, total] = await Promise.all([
      this.prisma.systemLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.systemLog.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  /** 近 N 天每天的异常数（ERROR / WARN 分组），用于后台趋势概览 */
  async dailySummary(days = 7) {
    const since = new Date(Date.now() - days * 86400000);
    const logs = await this.prisma.systemLog.findMany({
      where: { createdAt: { gte: since } },
      select: { level: true, createdAt: true },
    });
    const map: Record<string, { error: number; warn: number }> = {};
    for (const l of logs) {
      const day = l.createdAt.toISOString().slice(0, 10);
      if (!map[day]) map[day] = { error: 0, warn: 0 };
      if (l.level === 'ERROR') map[day].error++;
      else map[day].warn++;
    }
    const result: { date: string; error: number; warn: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      result.push({ date: day, ...(map[day] || { error: 0, warn: 0 }) });
    }
    return result;
  }
}
