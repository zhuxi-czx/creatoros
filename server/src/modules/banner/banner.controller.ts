import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { BannerService } from './banner.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { AdminGuard } from '../auth/admin.guard';

@Controller('api/banners')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Get()
  async getEnabledBanners() {
    return this.bannerService.getEnabledBanners();
  }
}

@UseGuards(AdminGuard)
@Controller('api/admin/banners')
export class AdminBannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Get()
  async getAllBanners() {
    return this.bannerService.getAllBanners();
  }

  @Post()
  async createBanner(@Body() dto: CreateBannerDto) {
    return this.bannerService.createBanner(dto);
  }

  @Put(':id')
  async updateBanner(@Param('id') id: string, @Body() dto: UpdateBannerDto) {
    return this.bannerService.updateBanner(id, dto);
  }

  @Delete(':id')
  async deleteBanner(@Param('id') id: string) {
    return this.bannerService.deleteBanner(id);
  }
}
