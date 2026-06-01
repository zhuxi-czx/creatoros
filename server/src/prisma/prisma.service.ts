import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly client: PrismaClient;

  // Expose Prisma model delegates for direct access
  readonly user: PrismaClient['user'];
  readonly venue: PrismaClient['venue'];
  readonly event: PrismaClient['event'];
  readonly signup: PrismaClient['signup'];
  readonly banner: PrismaClient['banner'];
  readonly order: PrismaClient['order'];

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    const adapter = new PrismaPg({ connectionString });
    this.client = new PrismaClient({ adapter });

    this.user = this.client.user;
    this.venue = this.client.venue;
    this.event = this.client.event;
    this.signup = this.client.signup;
    this.banner = this.client.banner;
    this.order = this.client.order;
  }

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }

  async $transaction<T>(
    fn: (prisma: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>,
  ): Promise<T> {
    return this.client.$transaction(fn);
  }
}
