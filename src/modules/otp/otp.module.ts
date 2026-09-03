import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SmsModule } from '../sms/sms.module';
import { OtpService } from './otp.service';
import { OtpResolver } from './otp.resolver';

@Module({
  imports: [SmsModule, PrismaModule],
  providers: [OtpService, OtpResolver],
  exports: [OtpService],
})
export class OtpModule {}
