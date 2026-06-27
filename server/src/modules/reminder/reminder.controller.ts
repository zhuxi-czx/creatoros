import { Controller, Put, Param, UseGuards, Request } from '@nestjs/common';
import { ReminderService } from './reminder.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
export class ReminderController {
  constructor(private readonly reminder: ReminderService) {}

  // 报名成功后，用户授权了开始提醒（前端 wx.requestSubscribeMessage 同意后调用）
  @UseGuards(JwtAuthGuard)
  @Put('api/events/:id/reminder-subscribe')
  async subscribe(@Request() req: any, @Param('id') eventId: string) {
    return this.reminder.markSubscribed(req.user.id, eventId);
  }
}
