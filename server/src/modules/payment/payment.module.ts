import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { WechatPayService } from './wechat-pay.service';
import { OrderCronService } from './order-cron.service';
import { MembershipModule } from '../membership/membership.module';

@Module({
  imports: [AuthModule, MembershipModule],
  controllers: [OrderController],
  providers: [OrderService, WechatPayService, OrderCronService],
  exports: [OrderService],
})
export class PaymentModule {}
