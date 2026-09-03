import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { SKIP_ALL_THROTTLES } from '../../common/constants/throttle.constants';

@ApiTags('Root')
@Controller()
@SkipThrottle(SKIP_ALL_THROTTLES)
export class RootController {
  @Get()
  @ApiOperation({ summary: 'Informations API (racine)' })
  @ApiOkResponse({ description: 'Liens vers les endpoints principaux' })
  root() {
    return {
      service: 'biso-livraison-api',
      status: 'ok',
      endpoints: {
        health: '/health',
        graphql: '/graphql',
        docs: '/api/docs',
        uploads: '/uploads',
      },
    };
  }
}
