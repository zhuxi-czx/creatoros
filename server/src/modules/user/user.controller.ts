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
} from '@nestjs/common';
import { UserService } from './user.service';
import { MembershipService } from '../membership/membership.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly membershipService: MembershipService,
  ) {}

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

  // 管理员手动开通/续费 PlanF 会员（一年期，已是会员则从到期日顺延）
  @UseGuards(AdminGuard)
  @Post('api/admin/users/:id/membership')
  async adminGrantMembership(@Param('id') id: string) {
    return this.membershipService.activate(id);
  }

  // 管理员取消用户 PlanF 会员资格（置为过期）
  @UseGuards(AdminGuard)
  @Delete('api/admin/users/:id/membership')
  async adminRevokeMembership(@Param('id') id: string) {
    return this.membershipService.deactivate(id);
  }
}
