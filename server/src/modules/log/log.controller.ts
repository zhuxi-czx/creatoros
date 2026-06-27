import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { LogService } from './log.service';
import { AdminGuard } from '../auth/admin.guard';

@Controller()
export class LogController {
  constructor(private readonly logService: LogService) {}

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
