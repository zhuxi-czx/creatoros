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
import { ContentService } from './content.service';
import { UpsertContentDto } from './dto/upsert-content.dto';
import { AdminGuard } from '../auth/admin.guard';

@Controller()
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  // ===== 前台 =====
  @Get('api/contents')
  async listPublished() {
    return this.contentService.listPublished();
  }

  @Get('api/contents/:id')
  async getPublished(@Param('id') id: string) {
    return this.contentService.getPublished(id);
  }

  // ===== 后台 =====
  @UseGuards(AdminGuard)
  @Get('api/admin/contents')
  async adminList() {
    return this.contentService.adminList();
  }

  @UseGuards(AdminGuard)
  @Get('api/admin/contents/:id')
  async adminGet(@Param('id') id: string) {
    return this.contentService.adminGet(id);
  }

  @UseGuards(AdminGuard)
  @Post('api/admin/contents')
  async adminCreate(@Body() dto: UpsertContentDto) {
    return this.contentService.adminCreate(dto);
  }

  @UseGuards(AdminGuard)
  @Put('api/admin/contents/:id')
  async adminUpdate(@Param('id') id: string, @Body() dto: UpsertContentDto) {
    return this.contentService.adminUpdate(id, dto);
  }

  @UseGuards(AdminGuard)
  @Delete('api/admin/contents/:id')
  async adminRemove(@Param('id') id: string) {
    return this.contentService.adminRemove(id);
  }
}
