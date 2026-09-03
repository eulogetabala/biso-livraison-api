import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { AppConfig } from '../config/configuration';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private ready = false;

  constructor(private readonly configService: ConfigService<AppConfig>) {}

  get isReady(): boolean {
    return this.ready;
  }

  async onModuleInit() {
    const url = this.configService.getOrThrow<AppConfig['redis']>('redis').url;
    if (!url) {
      this.logger.warn('REDIS_URL absent — OTP local et rate-limit restent en mémoire process.');
      return;
    }

    const client = new Redis(url, {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    client.on('error', (error) => {
      this.ready = false;
      this.logger.warn(`Redis indisponible : ${error.message}`);
    });

    try {
      await client.connect();
      await client.ping();
      this.client = client;
      this.ready = true;
      this.logger.log('Redis connecté');
    } catch (error) {
      this.logger.warn(
        `Redis non connecté (${error instanceof Error ? error.message : error}) — fallback mémoire pour OTP dev.`,
      );
      client.disconnect();
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.ready = false;
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client || !this.ready) return null;
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client || !this.ready) return;
    if (ttlSeconds != null) {
      await this.client.set(key, value, 'EX', ttlSeconds);
      return;
    }
    await this.client.set(key, value);
  }

  async del(key: string): Promise<void> {
    if (!this.client || !this.ready) return;
    await this.client.del(key);
  }
}
