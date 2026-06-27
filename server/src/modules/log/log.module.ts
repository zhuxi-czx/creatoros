import { Global, Module } from '@nestjs/common';
import { LogService } from './log.service';
import { LogController } from './log.controller';
import { SystemMonitorService } from './system-monitor.service';

// 全局模块：LogService 供异常过滤器、cron 等各处注入记录日志
@Global()
@Module({
  controllers: [LogController],
  providers: [LogService, SystemMonitorService],
  exports: [LogService],
})
export class LogModule {}
