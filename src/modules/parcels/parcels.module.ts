import { Module } from '@nestjs/common';
import { ParcelsService } from './parcels.service';
import { ParcelsResolver } from './parcels.resolver';
import { AuthModule } from '../auth/auth.module';
import { DeliveriesModule } from '../deliveries/deliveries.module';

@Module({
  imports: [AuthModule, DeliveriesModule],
  providers: [ParcelsService, ParcelsResolver],
  exports: [ParcelsService],
})
export class ParcelsModule {}
