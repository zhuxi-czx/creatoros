import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
} from '@nestjs/common';
import { VenueService } from './venue.service';
import { AdminGuard } from '../auth/admin.guard';
import { CreateVenueDto } from './dto/create-venue.dto';

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

@UseGuards(AdminGuard)
@Controller('api/admin/venues')
export class AdminVenueController {
  constructor(private readonly venueService: VenueService) {}

  @Post()
  async createVenue(@Body() dto: CreateVenueDto) {
    return this.venueService.createVenue(dto);
  }

  @Get()
  async getAllVenues() {
    return this.venueService.getAllVenues();
  }
}
