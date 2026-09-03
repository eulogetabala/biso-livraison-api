import { Module } from '@nestjs/common';
import { CmsService } from './cms.service';
import { CmsResolver } from './cms.resolver';

@Module({
  providers: [CmsService, CmsResolver],
  exports: [CmsService],
})
export class CmsModule {}
