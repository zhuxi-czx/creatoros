import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);
  private running = false;

  constructor(
    private prisma: PrismaService,
    private auth: AuthService,
  ) {}

  /** 报名后用户授权了「活动开始提醒」订阅消息 */
  async markSubscribed(userId: string, eventId: string) {
    await this.prisma.signup.updateMany({
      where: { userId, eventId },
      data: { reminderSubscribed: true },
    });
    return { ok: true };
  }

  /**
   * 每 30 分钟扫描：活动开始前约 2 小时（1h45m~2h15m 窗口）、已授权、未发送、
   * 状态 CONFIRMED 的报名，发送微信订阅消息提醒。
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async sendStartReminders() {
    if (this.running) return;
    const tmplId =
      process.env.WX_SUBSCRIBE_TMPL_ID ||
      'wixZ0YldvXWTivHsvz-PFcTEYD0RrK2EU02owRMTZPE'; // 活动开始提醒模板
    if (!tmplId) return;
    this.running = true;
    try {
      const now = Date.now();
      const from = new Date(now + 105 * 60 * 1000); // 1h45m 后
      const to = new Date(now + 135 * 60 * 1000); // 2h15m 后（30 分钟窗口，匹配扫描频率防漏）
      const signups = await this.prisma.signup.findMany({
        where: {
          status: 'CONFIRMED',
          reminderSubscribed: true,
          reminderSent: false,
          event: { date: { gte: from, lte: to } },
        },
        include: { user: true, event: { include: { venue: true } } },
      });
      if (!signups.length) return;
      const token = await this.auth.getAccessToken();
      let ok = 0;
      for (const s of signups) {
        try {
          await this.send(token, tmplId, s);
          await this.prisma.signup.update({
            where: { id: s.id },
            data: { reminderSent: true },
          });
          ok++;
        } catch (e: any) {
          this.logger.error(`开始提醒发送失败 signup=${s.id}: ${e?.message}`);
        }
      }
      this.logger.log(`开始提醒：命中 ${signups.length} 条，成功 ${ok} 条`);
    } catch (e: any) {
      this.logger.error(`开始提醒任务异常: ${e?.message}`);
    } finally {
      this.running = false;
    }
  }

  private async send(token: string, tmplId: string, s: any) {
    const event = s.event;
    const openId = s.user?.openId;
    if (!openId) return;
    const d = new Date(event.date);
    const pad = (n: number) => String(n).padStart(2, '0');
    const timeStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    // 模板「活动开始提醒」字段：商家名/活动主题/活动时间/活动地点/活动描述
    const body = {
      touser: openId,
      template_id: tmplId,
      page: `pages/event-detail/index?id=${event.id}`,
      data: {
        thing1: { value: String(event.hostName || event.venue?.name || '敞开酒馆').slice(0, 20) },
        thing5: { value: String(event.title || '活动').slice(0, 20) },
        time6: { value: timeStr },
        thing7: { value: String(event.venue?.name || event.location || '待定').slice(0, 20) },
        thing2: { value: '活动即将开始，记得准时参加' },
      },
    };
    const res: any = await fetch(
      `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${token}`,
      { method: 'POST', body: JSON.stringify(body) },
    ).then((r) => r.json());
    if (res.errcode && res.errcode !== 0) {
      throw new Error(`微信发送失败: ${res.errcode} ${res.errmsg}`);
    }
  }
}
