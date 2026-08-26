import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { buildSwaggerDocument } from './common/swagger/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Servir les fichiers uploadés (images restaurants, menus, avatars).
  // Un fichier dans public/uploads/x.jpg est accessible via /uploads/x.jpg
  app.useStaticAssets(join(process.cwd(), 'public'));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new LoggingInterceptor());

  // ── Swagger / OpenAPI (endpoints REST) ──────────────────────────────
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

  const port = parseInt(process.env.PORT ?? '3001', 10);
  await app.listen(port);
}
void bootstrap();
