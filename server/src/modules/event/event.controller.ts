import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
  Header,
} from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { UpdateEventStatusDto } from './dto/update-event-status.dto';
import { AddSignupDto } from './dto/add-signup.dto';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
export class EventController {
  constructor(private readonly eventService: EventService) {}

  // Public routes
  @Get('api/events')
  @Header('Cache-Control', 'private, max-age=10')
  async getPublishedEvents(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('city') city?: string,
    @Query('keyword') keyword?: string,
    @Query('userId') userId?: string,
  ) {
    return this.eventService.getPublishedEvents(page, limit, city, keyword, userId);
  }

  @Get('api/events/featured')
  @Header('Cache-Control', 'public, max-age=30')
  async getFeaturedEvents() {
    return this.eventService.getFeaturedEvents();
  }

  @Get('api/events/:id')
  async getEventById(@Param('id') id: string, @Query('userId') userId?: string) {
    return this.eventService.getEventById(id, userId);
  }

  @Get('api/events/:id/signups')
  async getEventSignups(@Param('id') id: string) {
    return this.eventService.getEventSignups(id);
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
    @Query('search') search?: string,
  ) {
    return this.eventService.adminGetEvents(page, limit, status, search);
  }

  @UseGuards(AdminGuard)
  @Get('api/admin/events/:id')
  async adminGetEventById(@Param('id') id: string) {
    return this.eventService.adminGetEventById(id);
  }

  @UseGuards(AdminGuard)
  @Get('api/admin/events/:id/signups')
  async adminGetEventSignups(
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.eventService.adminGetEventSignups(id, page, limit);
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
  @Post('api/admin/events/:id/copy')
  async adminCopyEvent(@Param('id') id: string) {
    return this.eventService.adminCopyEvent(id);
  }

  @UseGuards(AdminGuard)
  @Put('api/admin/events/:id/status')
  async adminUpdateEventStatus(
    @Param('id') id: string,
    @Body() dto: UpdateEventStatusDto,
  ) {
    return this.eventService.adminUpdateEventStatus(id, dto);
  }

  @UseGuards(AdminGuard)
  @Delete('api/admin/events/:id')
  async adminDeleteEvent(@Param('id') id: string) {
    return this.eventService.adminDeleteEvent(id);
  }

  @UseGuards(AdminGuard)
  @Post('api/admin/events/:id/signups')
  async adminAddSignup(@Param('id') id: string, @Body() dto: AddSignupDto) {
    return this.eventService.adminAddSignup(id, dto.userId);
  }
}
