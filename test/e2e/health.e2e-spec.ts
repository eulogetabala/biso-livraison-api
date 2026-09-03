import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createE2eApp } from '../helpers/app.helper';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createE2eApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health → 200 ok', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);

    expect(res.body).toMatchObject({
      status: 'ok',
      service: 'biso-livraison-api',
      database: 'ok',
    });
    expect(res.body.timestamp).toBeDefined();
    expect(res.body.version).toBeDefined();
  });
});
