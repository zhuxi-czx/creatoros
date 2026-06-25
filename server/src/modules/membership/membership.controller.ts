import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { MembershipService } from './membership.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class MembershipController {
  constructor(private readonly svc: MembershipService) {}

  /** 我的会员状态 + 本月免费名额（会员卡用）。 */
  @Get('api/membership')
  myInfo(@Request() req: any) {
    return this.svc.getMyInfo(req.user.id);
  }
}
