import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok', enum: ['ok', 'degraded'] })
  status: 'ok' | 'degraded';

  @ApiProperty({ example: 'biso-livraison-api' })
  service: string;

  @ApiProperty({ example: '0.0.1' })
  version: string;

  @ApiProperty({ example: '2026-08-26T15:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: 'ok', enum: ['ok', 'down'] })
  database: 'ok' | 'down';
}
