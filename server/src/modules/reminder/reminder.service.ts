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
   * 每 10 分钟扫描：活动开始前约 2 小时、已授权、未发送、状态 CONFIRMED 的报名，
   * 发送微信订阅消息提醒。需配置 WX_SUBSCRIBE_TMPL_ID（未配则不发送）。
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async sendStartReminders() {
    if (this.running) return;
    const tmplId = process.env.WX_SUBSCRIBE_TMPL_ID;
    if (!tmplId) return; // 模板未配置，跳过（链路已就绪，配置后即生效）
    this.running = true;
    try {
      const now = Date.now();
      const from = new Date(now + 110 * 60 * 1000); // 1h50m 后
      const to = new Date(now + 130 * 60 * 1000); // 2h10m 后
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
    // ⚠️ data 的字段 key（thing1/time2/thing3）需按实际申请的订阅消息模板调整
    const body = {
      touser: openId,
      template_id: tmplId,
      page: `pages/event-detail/index?id=${event.id}`,
      data: {
        thing1: { value: String(event.title || '活动').slice(0, 20) },
        time2: { value: timeStr },
        thing3: { value: String(event.venue?.name || event.location || '待定').slice(0, 20) },
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
