import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrderService } from './order.service';

/** 每 5 分钟关闭超时未支付订单，及时释放名额。 */
@Injectable()
export class OrderCronService {
  constructor(private readonly orderService: OrderService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCloseExpired() {
    await this.orderService.closeExpiredOrders();
  }
}
