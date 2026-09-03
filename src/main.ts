import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { buildSwaggerDocument } from './common/swagger/swagger.config';
import { AppConfig } from './config/configuration';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableShutdownHooks();

  const configService = app.get(ConfigService<AppConfig>);
  const uploads = configService.getOrThrow<AppConfig['uploads']>('uploads');

  const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Assets statiques + uploads (Render : disque persistant via UPLOAD_DIR)
  app.useStaticAssets(join(process.cwd(), 'public'));
  app.useStaticAssets(uploads.directory, { prefix: '/uploads' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new LoggingInterceptor());

  const isProduction =
    configService.getOrThrow<AppConfig['app']>('app').isProduction;

  if (!isProduction) {
    const swaggerConfig = buildSwaggerDocument();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      jsonDocumentUrl: 'api/docs-json',
      customSiteTitle: 'Biso Livraison API',
    });

    const docsDir = join(process.cwd(), 'docs');
    if (!existsSync(docsDir)) mkdirSync(docsDir, { recursive: true });
    writeFileSync(
      join(docsDir, 'openapi.json'),
      JSON.stringify(document, null, 2),
    );
  }

  const port = parseInt(process.env.PORT ?? '3001', 10);
  await app.listen(port, '0.0.0.0');
  console.log(`API listening on port ${port}`);
}

void bootstrap().catch((error) => {
  console.error('Bootstrap failed:', error);
  process.exit(1);
});
