import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { PaymentModule } from './modules/payment/payment.module';
import { UserModule } from './modules/user/user.module';
import { EventModule } from './modules/event/event.module';
import { SignupModule } from './modules/signup/signup.module';
import { VenueModule } from './modules/venue/venue.module';
import { UploadModule } from './modules/upload/upload.module';
import { BannerModule } from './modules/banner/banner.module';
import { HealthModule } from './modules/health/health.module';
import { CreatorModule } from './modules/creator/creator.module';
import { ContentModule } from './modules/content/content.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UserModule,
    EventModule,
    SignupModule,
    VenueModule,
    UploadModule,
    BannerModule,
    HealthModule,
    PaymentModule,
    CreatorModule,
    ContentModule,
  ],
})
export class AppModule {}
