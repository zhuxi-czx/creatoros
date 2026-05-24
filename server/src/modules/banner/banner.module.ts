import { Module } from '@nestjs/common';
import { BannerController, AdminBannerController } from './banner.controller';
import { BannerService } from './banner.service';

@Module({
  controllers: [BannerController, AdminBannerController],
  providers: [BannerService],
  exports: [BannerService],
})
export class BannerModule {}
