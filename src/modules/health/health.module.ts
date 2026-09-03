import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { HealthController } from './health.controller';
import { RootController } from './root.controller';

@Module({
  imports: [PrismaModule],
  controllers: [RootController, HealthController],
})
export class HealthModule {}
