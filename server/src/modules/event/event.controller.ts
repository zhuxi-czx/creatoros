import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { UpdateEventStatusDto } from './dto/update-event-status.dto';
import { AdminGuard } from '../auth/admin.guard';

@Controller()
export class EventController {
  constructor(private readonly eventService: EventService) {}

  // Public routes
  @Get('api/events')
  async getPublishedEvents(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('city') city?: string,
  ) {
    return this.eventService.getPublishedEvents(page, limit, city);
  }

  @Get('api/events/featured')
  async getFeaturedEvents() {
    return this.eventService.getFeaturedEvents();
  }

  @Get('api/events/:id')
  async getEventById(@Param('id') id: string) {
    return this.eventService.getEventById(id);
  }

  // Admin routes
  @UseGuards(AdminGuard)
  @Get('api/admin/stats')
  async adminGetStats() {
    return this.eventService.adminGetStats();
  }

  @UseGuards(AdminGuard)
  @Get('api/admin/events')
  async adminGetEvents(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ) {
    return this.eventService.adminGetEvents(page, limit, status);
  }

  @UseGuards(AdminGuard)
  @Post('api/admin/events')
  async adminCreateEvent(@Body() dto: CreateEventDto) {
    return this.eventService.adminCreateEvent(dto);
  }

  @UseGuards(AdminGuard)
  @Put('api/admin/events/:id')
  async adminUpdateEvent(
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventService.adminUpdateEvent(id, dto);
  }

  @UseGuards(AdminGuard)
  @Put('api/admin/events/:id/status')
  async adminUpdateEventStatus(
    @Param('id') id: string,
    @Body() dto: UpdateEventStatusDto,
  ) {
    return this.eventService.adminUpdateEventStatus(id, dto);
  }
}
