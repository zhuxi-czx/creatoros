import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { UpsertCategoryDto } from './dto/upsert-category.dto';
import { AdminGuard } from '../auth/admin.guard';

@Controller()
export class CategoryController {
  constructor(private readonly svc: CategoryService) {}

  // ===== 前台 =====
  @Get('api/categories')
  listForApp() {
    return this.svc.listForApp();
  }

  @Get('api/categories/:id')
  getPage(@Param('id') id: string) {
    return this.svc.getCategoryPage(id);
  }

  // ===== 后台 =====
  @UseGuards(AdminGuard)
  @Get('api/admin/categories')
  adminList() {
    return this.svc.adminList();
  }

  @UseGuards(AdminGuard)
  @Post('api/admin/categories')
  create(@Body() dto: UpsertCategoryDto) {
    return this.svc.adminCreate(dto);
  }

  @UseGuards(AdminGuard)
  @Post('api/admin/categories/quick')
  quick(@Body() dto: UpsertCategoryDto) {
    return this.svc.quickCreate(dto.name);
  }

  @UseGuards(AdminGuard)
  @Put('api/admin/categories/:id')
  update(@Param('id') id: string, @Body() dto: UpsertCategoryDto) {
    return this.svc.adminUpdate(id, dto);
  }

  @UseGuards(AdminGuard)
  @Delete('api/admin/categories/:id')
  remove(@Param('id') id: string) {
    return this.svc.adminRemove(id);
  }
}
