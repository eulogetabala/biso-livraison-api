import { Module } from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { DeliveriesResolver } from './deliveries.resolver';
import { AuthModule } from '../auth/auth.module';
import { SmsModule } from '../sms/sms.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TrackingModule } from '../tracking/tracking.module';

@Module({
  imports: [AuthModule, SmsModule, NotificationsModule, TrackingModule],
  providers: [DeliveriesService, DeliveriesResolver],
  exports: [DeliveriesService],
})
export class DeliveriesModule {}
