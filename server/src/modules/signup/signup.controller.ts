import {
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SignupService } from './signup.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/events/:id')
export class SignupController {
  constructor(private readonly signupService: SignupService) {}

  @UseGuards(JwtAuthGuard)
  @Post('signup')
  async signupForEvent(@Request() req: any, @Param('id') eventId: string) {
    return this.signupService.signupForEvent(req.user.id, eventId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('signup')
  async cancelSignup(@Request() req: any, @Param('id') eventId: string) {
    return this.signupService.cancelSignup(req.user.id, eventId);
  }
}
