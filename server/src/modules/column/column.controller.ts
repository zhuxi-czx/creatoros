import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ColumnService } from './column.service';
import { AdminGuard } from '../auth/admin.guard';
import { UpdateColumnDto } from './dto/update-column.dto';
import { MoveColumnDto } from './dto/move-column.dto';

@Controller()
export class ColumnController {
  constructor(private readonly svc: ColumnService) {}

  @Get('api/columns')
  listForApp() {
    return this.svc.listForApp();
  }

  @Get('api/columns/:type')
  getPage(@Param('type') type: string) {
    return this.svc.getColumnPage(type.toUpperCase());
  }

  @UseGuards(AdminGuard)
  @Get('api/admin/columns')
  adminList() {
    return this.svc.adminList();
  }

  @UseGuards(AdminGuard)
  @Put('api/admin/columns/:type')
  update(
    @Param('type') type: string,
    @Body() dto: UpdateColumnDto,
  ) {
    return this.svc.adminUpdate(type.toUpperCase(), dto);
  }

  @UseGuards(AdminGuard)
  @Put('api/admin/columns/:type/move')
  move(@Param('type') type: string, @Body() dto: MoveColumnDto) {
    return this.svc.adminMove(type.toUpperCase(), dto.dir);
  }
}
