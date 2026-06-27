import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
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
import { CategoryModule } from './modules/category/category.module';
import { ColumnModule } from './modules/column/column.module';
import { CouponModule } from './modules/coupon/coupon.module';
import { MembershipModule } from './modules/membership/membership.module';
import { IconModule } from './modules/icon/icon.module';
import { ReminderModule } from './modules/reminder/reminder.module';
import { LogModule } from './modules/log/log.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]), // 全局兜底限流：120 次/分/IP
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
    CategoryModule,
    ColumnModule,
    CouponModule,
    MembershipModule,
    IconModule,
    ReminderModule,
    LogModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
