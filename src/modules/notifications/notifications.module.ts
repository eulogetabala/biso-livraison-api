import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsResolver } from './notifications.resolver';
import { PushService } from './push.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [NotificationsService, NotificationsResolver, PushService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
