import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import { LogService } from './log.service';
import { PrismaService } from '../../prisma/prisma.service';

const execAsync = promisify(exec);

/** 服务器资源监控：磁盘 / 内存，异常落库供后台监控；并定期清理过期日志 */
@Injectable()
export class SystemMonitorService {
  private readonly logger = new Logger(SystemMonitorService.name);

  constructor(
    private readonly logService: LogService,
    private readonly prisma: PrismaService,
  ) {}

  /** 实时健康快照：API / 数据库 / 磁盘 / 内存 / 运行时长，供后台监控页展示。 */
  async getSnapshot() {
    const snap: any = {
      api: 'online',
      uptimeSec: Math.round(process.uptime()),
      db: 'unknown',
      memory: { usedPct: 0, totalMB: 0, usedMB: 0 },
      disk: { usedPct: -1, usedHuman: '', sizeHuman: '' },
      at: new Date().toISOString(),
    };
    // 数据库连接
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      snap.db = 'ok';
    } catch {
      snap.db = 'error';
    }
    // 内存
    try {
      const total = os.totalmem();
      const used = total - os.freemem();
      snap.memory = {
        usedPct: Math.round((used / total) * 100),
        totalMB: Math.round(total / 1048576),
        usedMB: Math.round(used / 1048576),
      };
    } catch {
      /* 忽略 */
    }
    // 磁盘（df -P / 默认 1K 块）
    try {
      const { stdout } = await execAsync('df -P /');
      const cols = (stdout.trim().split('\n')[1] || '').split(/\s+/);
      const pct = (stdout.match(/(\d+)%/) || [])[1];
      snap.disk = {
        usedPct: pct ? parseInt(pct, 10) : -1,
        usedHuman: cols[2] ? `${(parseInt(cols[2], 10) / 1048576).toFixed(1)}G` : '',
        sizeHuman: cols[1] ? `${(parseInt(cols[1], 10) / 1048576).toFixed(0)}G` : '',
      };
    } catch {
      /* 忽略 */
    }
    return snap;
  }

  /** 每小时检查根分区磁盘使用率：≥85% 告警、≥95% 紧急（共享服务器，磁盘满影响所有项目） */
  @Cron(CronExpression.EVERY_HOUR)
  async checkResources() {
    // 磁盘
    try {
      const { stdout } = await execAsync('df -P /');
      const line = stdout.trim().split('\n')[1] || '';
      const m = line.match(/(\d+)%/);
      if (m) {
        const used = parseInt(m[1], 10);
        if (used >= 95) {
          await this.logService.record('ERROR', 'system', `磁盘空间紧张：根分区已用 ${used}%，请尽快清理（备份/日志/上传文件）`);
        } else if (used >= 85) {
          await this.logService.record('WARN', 'system', `磁盘空间偏高：根分区已用 ${used}%`);
        }
      }
    } catch (e: any) {
      this.logger.error(`磁盘检查失败: ${e?.message}`);
    }
    // 内存（可用内存占比过低时告警）
    try {
      const freePct = Math.round((os.freemem() / os.totalmem()) * 100);
      if (freePct <= 5) {
        await this.logService.record('WARN', 'system', `可用内存偏低：仅剩 ${freePct}%`);
      }
    } catch {
      /* 忽略 */
    }
  }

  /** 每天 3:00 清理 7 天前的系统日志，避免表无限增长 */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanOldLogs() {
    try {
      const cutoff = new Date(Date.now() - 7 * 86400000);
      const r = await this.prisma.systemLog.deleteMany({
        where: { createdAt: { lt: cutoff } },
      });
      if (r.count) this.logger.log(`清理过期系统日志 ${r.count} 条`);
    } catch (e: any) {
      this.logger.error(`清理日志失败: ${e?.message}`);
    }
  }
}
