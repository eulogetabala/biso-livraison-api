import { Module } from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { DeliveriesResolver } from './deliveries.resolver';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [DeliveriesService, DeliveriesResolver],
  exports: [DeliveriesService],
})
export class DeliveriesModule {}
