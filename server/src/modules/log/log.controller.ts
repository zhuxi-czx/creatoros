import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { LogService } from './log.service';
import { SystemMonitorService } from './system-monitor.service';
import { AdminGuard } from '../auth/admin.guard';

@Controller()
export class LogController {
  constructor(
    private readonly logService: LogService,
    private readonly systemMonitor: SystemMonitorService,
  ) {}

  /** 实时服务健康快照（API / 数据库 / 磁盘 / 内存 / 运行时长） */
  @UseGuards(AdminGuard)
  @Get('api/admin/system-health')
  health() {
    return this.systemMonitor.getSnapshot();
  }

  @UseGuards(AdminGuard)
  @Get('api/admin/logs')
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('level') level?: string,
    @Query('source') source?: string,
    @Query('date') date?: string,
  ) {
    return this.logService.list({
      page: page ? +page : 1,
      limit: limit ? +limit : 30,
      level,
      source,
      date,
    });
  }

  @UseGuards(AdminGuard)
  @Get('api/admin/logs/summary')
  summary(@Query('days') days?: string) {
    return this.logService.dailySummary(days ? +days : 7);
  }
}
