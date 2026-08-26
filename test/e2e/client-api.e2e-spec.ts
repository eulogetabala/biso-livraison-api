import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  createE2eApp,
  uniquePhone,
} from '../helpers/app.helper';
import {
  gql,
  expectGqlOk,
  loginAs,
  registerUser,
} from '../helpers/graphql.helper';

describe('Client API — Orders, Parcels, Notifications (e2e)', () => {
  let app: INestApplication;
  let token: string;
  const password = 'ClientPass123';
  const phone = uniquePhone('201');

  beforeAll(async () => {
    app = await createE2eApp();
    await registerUser(app, {
      phone,
      password,
      firstName: 'Client',
      lastName: 'E2E',
    });
    token = await loginAs(app, phone, password);
  });

  afterAll(async () => {
    await app.close();
  });

  it('myOrders → liste (vide ou existante)', async () => {
    const body = await gql<{
      myOrders: { items: unknown[]; pageInfo: { totalItems: number } };
    }>(
      app,
      `query MyOrders($page: Int, $limit: Int) {
        myOrders(page: $page, limit: $limit) {
          items { id status total grandTotal createdAt }
          pageInfo { totalItems currentPage }
        }
      }`,
      { page: 1, limit: 10 },
      token,
    );
    expectGqlOk(body);
    expect(Array.isArray(body.data.myOrders.items)).toBe(true);
  });

  it('myParcels → liste', async () => {
    const body = await gql<{
      myParcels: { items: unknown[]; pageInfo: { totalItems: number } };
    }>(
      app,
      `query MyParcels($page: Int, $limit: Int) {
        myParcels(page: $page, limit: $limit) {
          items { id status createdAt }
          pageInfo { totalItems currentPage }
        }
      }`,
      { page: 1, limit: 10 },
      token,
    );
    expectGqlOk(body);
    expect(Array.isArray(body.data.myParcels.items)).toBe(true);
  });

  it('myNotifications → liste', async () => {
    const body = await gql<{
      myNotifications: { items: unknown[]; pageInfo: { totalItems: number } };
    }>(
      app,
      `query MyNotifications($page: Int, $limit: Int) {
        myNotifications(page: $page, limit: $limit) {
          items { id title message readAt createdAt }
          pageInfo { totalItems currentPage }
        }
      }`,
      { page: 1, limit: 10 },
      token,
    );
    expectGqlOk(body);
    expect(Array.isArray(body.data.myNotifications.items)).toBe(true);
  });

  it('unreadNotificationsCount → nombre', async () => {
    const body = await gql<{ unreadNotificationsCount: number }>(
      app,
      `query { unreadNotificationsCount }`,
      undefined,
      token,
    );
    expectGqlOk(body);
    expect(typeof body.data.unreadNotificationsCount).toBe('number');
  });

  it('updateProfile → met à jour le prénom', async () => {
    const body = await gql<{ updateProfile: { firstName: string } }>(
      app,
      `mutation UpdateProfile($input: UpdateProfileInput!) {
        updateProfile(input: $input) { id firstName lastName phone }
      }`,
      { input: { firstName: 'ClientUpdated' } },
      token,
    );
    expectGqlOk(body);
    expect(body.data.updateProfile.firstName).toBe('ClientUpdated');
  });

  it('sans token → myOrders refusé', async () => {
    const body = await gql(
      app,
      `query { myOrders { items { id } pageInfo { totalItems } } }`,
    );
    expect(body.errors?.length).toBeGreaterThan(0);
  });
});

describe('Uploads REST (e2e)', () => {
  let app: INestApplication;
  let token: string;
  const password = 'UploadPass123';
  const phone = uniquePhone('301');

  beforeAll(async () => {
    app = await createE2eApp();
    await registerUser(app, {
      phone,
      password,
      firstName: 'Upload',
      lastName: 'Test',
    });
    token = await loginAs(app, phone, password);
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /uploads/image sans token → 401', async () => {
    await request(app.getHttpServer())
      .post('/uploads/image')
      .attach('file', Buffer.from('fake'), { filename: 'test.jpg', contentType: 'image/jpeg' })
      .expect(401);
  });

  it('POST /uploads/image avec token → 201 + url', async () => {
    // Minimal valid JPEG header
    const jpegBuffer = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46,
    ]);

    const res = await request(app.getHttpServer())
      .post('/uploads/image')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', jpegBuffer, {
        filename: 'test-e2e.jpg',
        contentType: 'image/jpeg',
      })
      .expect(201);

    expect(res.body.url).toMatch(/^\/uploads\//);
    expect(res.body.mimeType).toBe('image/jpeg');
    expect(res.body.size).toBeGreaterThan(0);
  });
});
