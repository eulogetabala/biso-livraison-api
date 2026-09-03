import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../../prisma/prisma.service';
import { SKIP_ALL_THROTTLES } from '../../common/constants/throttle.constants';
import { HealthResponseDto } from './dto/health-response.dto';

@ApiTags('Health')
@Controller('health')
@SkipThrottle(SKIP_ALL_THROTTLES)
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({
    summary: 'Vérifier l’état du service',
    description:
      'Endpoint de supervision (load balancer, CI, monitoring). ' +
      'Retourne le statut du service, la version déployée et l’état Postgres.',
  })
  @ApiOkResponse({ type: HealthResponseDto })
  async check(): Promise<HealthResponseDto> {
    let database: HealthResponseDto['database'] = 'ok';

    try {
      await this.prisma.ping();
    } catch {
      database = 'down';
    }

    const payload: HealthResponseDto = {
      status: database === 'ok' ? 'ok' : 'degraded',
      service: 'biso-livraison-api',
      version: process.env.npm_package_version ?? '0.0.1',
      timestamp: new Date().toISOString(),
      database,
    };

    if (database !== 'ok') {
      throw new ServiceUnavailableException(payload);
    }

    return payload;
  }
}
