import { Module } from '@nestjs/common';
import { VenueController, AdminVenueController } from './venue.controller';
import { VenueService } from './venue.service';

@Module({
  controllers: [VenueController, AdminVenueController],
  providers: [VenueService],
  exports: [VenueService],
})
export class VenueModule {}
