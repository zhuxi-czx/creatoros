import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  // User routes
  @UseGuards(JwtAuthGuard)
  @Put('api/users/profile')
  async updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('api/users/signups')
  async getMySignups(@Request() req: any) {
    return this.userService.getMySignups(req.user.id);
  }

  @Get('api/users/:id')
  async getPublicProfile(@Param('id') id: string) {
    return this.userService.getPublicProfile(id);
  }

  // Admin routes
  @UseGuards(AdminGuard)
  @Get('api/admin/users')
  async adminListUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.userService.adminListUsers(page, limit, search);
  }

  @UseGuards(AdminGuard)
  @Get('api/admin/users/:id')
  async adminGetUser(@Param('id') id: string) {
    return this.userService.adminGetUser(id);
  }

  @UseGuards(AdminGuard)
  @Put('api/admin/users/:id/status')
  async adminUpdateUserStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.userService.adminUpdateUserStatus(id, dto);
  }

  // 设置/取消 Creator 身份
  @UseGuards(AdminGuard)
  @Put('api/admin/users/:id/creator')
  async adminSetCreator(
    @Param('id') id: string,
    @Body() body: { isCreator: boolean },
  ) {
    return this.userService.adminSetCreator(id, !!body.isCreator);
  }
}
