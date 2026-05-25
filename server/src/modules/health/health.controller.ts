import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('api')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get('health')
  async check() {
    try {
      await this.prisma.user.count();
      return { status: 'ok', timestamp: new Date().toISOString() };
    } catch {
      return { status: 'error', timestamp: new Date().toISOString() };
    }
  }
}
