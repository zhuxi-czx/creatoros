import {
  Controller,
  Post,
  Get,
  Param,
  Req,
  Res,
  Headers,
  UseGuards,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { OrderService } from './order.service';
import { WechatPayService } from './wechat-pay.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller()
export class OrderController {
  private readonly logger = new Logger(OrderController.name);

  constructor(
    private readonly orderService: OrderService,
    private readonly wechatPay: WechatPayService,
  ) {}

  /** 付费报名下单，返回 wx.requestPayment 参数。 */
  @UseGuards(JwtAuthGuard)
  @Post('api/events/:id/checkout')
  async checkout(@Req() req: any, @Param('id') eventId: string) {
    return this.orderService.checkout(req.user.id, eventId);
  }

  /** 查询订单/报名状态（前端支付后轮询）。 */
  @UseGuards(JwtAuthGuard)
  @Get('api/orders/:id')
  async getOrder(@Req() req: any, @Param('id') orderId: string) {
    return this.orderService.getOrder(req.user.id, orderId);
  }

  /** 后台对某条报名退款（原路退回）。 */
  @UseGuards(AdminGuard)
  @Post('api/admin/signups/:id/refund')
  async adminRefund(@Param('id') signupId: string) {
    return this.orderService.adminRefundSignup(signupId);
  }

  /**
   * 微信支付结果回调。验签 + 解密 + 幂等确认。
   * 成功返回 200 {code:SUCCESS}；失败返回非 200，微信会重试。
   */
  @Post('api/pay/notify')
  async notify(
    @Req() req: Request,
    @Res() res: Response,
    @Headers() headers: Record<string, any>,
  ) {
    try {
      const rawBody = (req as any).rawBody?.toString('utf8') ?? JSON.stringify(req.body);
      const resource = await this.wechatPay.verifyAndDecryptNotify(headers, rawBody);
      if (!resource) {
        res.status(401).json({ code: 'FAIL', message: '验签失败' });
        return;
      }
      if (resource.trade_state === 'SUCCESS') {
        await this.orderService.confirmPaid(
          resource.out_trade_no,
          resource.transaction_id,
        );
      }
      res.status(200).json({ code: 'SUCCESS' });
    } catch (err: any) {
      this.logger.error(`支付回调处理异常: ${err?.message}`, err?.stack);
      // 返回非 200，微信会重试
      res.status(500).json({ code: 'FAIL', message: '处理失败' });
    }
  }
}
