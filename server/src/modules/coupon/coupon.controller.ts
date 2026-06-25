import { Controller, Get, Post, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class CouponController {
  constructor(private readonly svc: CouponService) {}

  @Get('api/coupons')
  listMine(@Request() req: any) {
    return this.svc.listMine(req.user.id);
  }

  @Post('api/coupons/:id/use')
  use(@Request() req: any, @Param('id') id: string) {
    return this.svc.use(req.user.id, id);
  }

  @Delete('api/coupons/:id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.svc.remove(req.user.id, id);
  }
}
