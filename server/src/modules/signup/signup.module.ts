import { Module } from '@nestjs/common';
import { SignupController } from './signup.controller';
import { SignupService } from './signup.service';
import { AuthModule } from '../auth/auth.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [AuthModule, PaymentModule],
  controllers: [SignupController],
  providers: [SignupService],
})
export class SignupModule {}
