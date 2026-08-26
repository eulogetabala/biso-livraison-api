import { Module } from '@nestjs/common';
import { SmsModule } from '../sms/sms.module';
import { OtpService } from './otp.service';
import { OtpResolver } from './otp.resolver';

@Module({
  imports: [SmsModule],
  providers: [OtpService, OtpResolver],
  exports: [OtpService],
})
export class OtpModule {}
