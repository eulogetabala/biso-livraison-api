import { Module } from '@nestjs/common';
import { GeoService } from './geo.service';
import { GeoResolver } from './geo.resolver';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [GeoService, GeoResolver],
  exports: [GeoService],
})
export class GeoModule {}
