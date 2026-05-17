import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { VenueService } from './venue.service';

@Controller('api/venues')
export class VenueController {
  constructor(private readonly venueService: VenueService) {}

  @Get(':id')
  async getVenueById(@Param('id') id: string) {
    return this.venueService.getVenueById(id);
  }

  @Get(':id/events')
  async getVenueEvents(
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.venueService.getVenueEvents(id, page, limit);
  }
}
