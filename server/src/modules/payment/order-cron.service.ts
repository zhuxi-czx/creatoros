import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrderService } from './order.service';
import { LogService } from '../log/log.service';

/** 每 5 分钟关闭超时未支付订单，及时释放名额。 */
@Injectable()
export class OrderCronService {
  private readonly logger = new Logger(OrderCronService.name);
  private closing = false;
  private reconciling = false;

  constructor(
    private readonly orderService: OrderService,
    private readonly logService: LogService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCloseExpired() {
    if (this.closing) return; // 重入保护：上一轮未结束则跳过
    this.closing = true;
    try {
      await this.orderService.closeExpiredOrders();
    } catch (e) {
      const stack = e instanceof Error ? e.stack : String(e);
      this.logger.error('closeExpiredOrders 失败', stack);
      void this.logService.record('ERROR', 'cron', 'closeExpiredOrders 失败', stack);
    } finally {
      this.closing = false;
    }
  }

  /** 每 5 分钟对账处理中的退款单，及时落地 REFUNDED 状态。 */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleReconcileRefunds() {
    if (this.reconciling) return;
    this.reconciling = true;
    try {
      await this.orderService.reconcileRefundingOrders();
    } catch (e) {
      const stack = e instanceof Error ? e.stack : String(e);
      this.logger.error('reconcileRefundingOrders 失败', stack);
      void this.logService.record('ERROR', 'cron', 'reconcileRefundingOrders 失败', stack);
    } finally {
      this.reconciling = false;
    }
  }
}
