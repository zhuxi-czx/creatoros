import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { EventModule } from './modules/event/event.module';
import { SignupModule } from './modules/signup/signup.module';
import { VenueModule } from './modules/venue/venue.module';
import { UploadModule } from './modules/upload/upload.module';
import { BannerModule } from './modules/banner/banner.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UserModule,
    EventModule,
    SignupModule,
    VenueModule,
    UploadModule,
    BannerModule,
  ],
})
export class AppModule {}
