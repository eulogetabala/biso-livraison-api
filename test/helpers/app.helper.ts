import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { join } from 'path';
import { AppModule } from '../../src/app.module';

/** Bootstrap une instance NestJS identique à la prod pour les tests e2e. */
export async function createE2eApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication<NestExpressApplication>();
  app.useStaticAssets(join(process.cwd(), 'public'));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  await app.init();
  return app;
}

/** Génère un numéro de téléphone unique pour éviter les collisions en tests. */
export function uniquePhone(suffix = '001'): string {
  const ts = Date.now().toString().slice(-6);
  return `+24206${ts}${suffix}`.slice(0, 14);
}
