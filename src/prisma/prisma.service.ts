import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { AppConfig } from '../config/configuration';
import { buildPoolOptions } from './pg-connection';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly pool: Pool;

  constructor(configService: ConfigService<AppConfig>) {
    const db = configService.getOrThrow<AppConfig['database']>('database');
    if (!db.url) {
      throw new Error('DATABASE_URL is not defined');
    }

    // Normalise `sslmode` en options `ssl` explicites : supprime l'avertissement
    // pg-connection-string et rend le comportement TLS déterministe.
    const { connectionString, ssl } = buildPoolOptions(db.url);

    // Neon (et autres Postgres serverless) mettent la base en veille : le réveil
    // peut prendre plusieurs secondes. On garde un timeout de connexion large et
    // configurable pour éviter des "connection timeout" au premier appel.
    const connectTimeoutMs = Number(process.env.DB_CONNECT_TIMEOUT_MS ?? 15_000);

    const pool = new Pool({
      connectionString,
      ssl,
      max: db.poolMax,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: Number.isFinite(connectTimeoutMs) ? connectTimeoutMs : 15_000,
    });

    const adapter = new PrismaPg(pool);
    super({ adapter });
    this.pool = pool;
  }

  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      // Ne pas faire planter le démarrage si la base est momentanément
      // injoignable : le service reste up, `/health` remonte `database: down`
      // et Prisma retentera la connexion à la prochaine requête.
      this.logger.error(
        `Connexion initiale à la base impossible — ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
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
