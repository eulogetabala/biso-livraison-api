import { Module } from '@nestjs/common';
import { ParcelsService } from './parcels.service';
import { ParcelsResolver } from './parcels.resolver';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [ParcelsService, ParcelsResolver],
  exports: [ParcelsService],
})
export class ParcelsModule {}
