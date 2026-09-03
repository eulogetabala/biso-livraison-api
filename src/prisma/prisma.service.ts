import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { AppConfig } from '../config/configuration';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly pool: Pool;

  constructor(configService: ConfigService<AppConfig>) {
    const db = configService.getOrThrow<AppConfig['database']>('database');
    if (!db.url) {
      throw new Error('DATABASE_URL is not defined');
    }

    const pool = new Pool({
      connectionString: db.url,
      max: db.poolMax,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });

    const adapter = new PrismaPg(pool);
    super({ adapter });
    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }

  /** Probe utilisé par le health check (load balancer). */
  async ping(): Promise<void> {
    await this.$queryRaw`SELECT 1`;
  }
}
