import { Module } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { StatisticsResolver } from './statistics.resolver';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [StatisticsService, StatisticsResolver],
  exports: [StatisticsService],
})
export class StatisticsModule {}
