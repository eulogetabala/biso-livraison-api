import { Module } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { TrackingResolver } from './tracking.resolver';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [TrackingService, TrackingResolver],
  exports: [TrackingService],
})
export class TrackingModule {}
