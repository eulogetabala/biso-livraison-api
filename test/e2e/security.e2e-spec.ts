import { INestApplication } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { createE2eApp, uniquePhone } from '../helpers/app.helper';
import {
  expectGqlForbidden,
  expectGqlOk,
  gql,
  loginAs,
  registerUser,
} from '../helpers/graphql.helper';

const ADMIN_PHONE = process.env.ADMIN_PHONE ?? '+242065644299';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'Admin123!';
const DRIVER_PHONE = process.env.DRIVER_PHONE ?? '+242066000111';
const DRIVER_PASSWORD = process.env.DRIVER_PASSWORD ?? 'Driver123!';
const PARTNER_PHONE = process.env.PARTNER_PHONE ?? '+242067000111';
const PARTNER_PASSWORD = process.env.PARTNER_PASSWORD ?? 'Partner123!';
const PARTNER_RESTAURANT_ID =
  process.env.PARTNER_RESTAURANT_ID ??
  'f0000001-0000-4000-8000-000000000001';
const OTHER_RESTAURANT_ID = 'f0000001-0000-4000-8000-000000000002';

/**
 * Tests de sécurité maison — sans outil externe.
 * Couvre auth, IDOR, élévation de privilèges et endpoints publics sensibles.
 */
describe('Security audit (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let clientToken: string;
  let driverToken: string;

  beforeAll(async () => {
    app = await createE2eApp();
    adminToken = await loginAs(app, ADMIN_PHONE, ADMIN_PASSWORD);
    driverToken = await loginAs(app, DRIVER_PHONE, DRIVER_PASSWORD);

    const clientPhone = uniquePhone('901');
    await registerUser(app, {
      phone: clientPhone,
      password: 'ClientSec123!',
      firstName: 'Sec',
      lastName: 'Client',
    });
    clientToken = await loginAs(app, clientPhone, 'ClientSec123!');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Inscription — pas de contournement OTP', () => {
    it('createUser force phoneVerified à false', async () => {
      const phone = uniquePhone('902');
      const body = await gql<{
        createUser: { id: string; phoneVerified: boolean };
      }>(
        app,
        `mutation Register($input: CreateUserInput!) {
          createUser(input: $input) { id phone phoneVerified }
        }`,
        {
          input: {
            phone,
            password: 'TestPass123',
            firstName: 'New',
            lastName: 'User',
          },
        },
      );
      expectGqlOk(body);
      expect(body.data.createUser.phoneVerified).toBe(false);
    });
  });

  describe('Contrôle d\'accès par rôle', () => {
    it('client ne peut pas lister toutes les commandes admin', async () => {
      const body = await gql(
        app,
        `query { orders(page: 1, limit: 5) { items { id } } }`,
        undefined,
        clientToken,
      );
      expectGqlForbidden(body);
    });

    it('sans token → orders refusé', async () => {
      const body = await gql(
        app,
        `query { orders(page: 1, limit: 5) { items { id } } }`,
      );
      expect(body.errors?.length).toBeGreaterThan(0);
    });

    it('client ne peut pas accéder aux stats admin', async () => {
      const body = await gql(
        app,
        `query { catalogStats { restaurants menuDishes } }`,
        undefined,
        clientToken,
      );
      expectGqlForbidden(body);
    });
  });

  describe('IDOR — updateOrderStatus', () => {
    let foreignOrderId: string | undefined;
    let driverAssignedOrderId: string | undefined;

    beforeAll(async () => {
      const list = await gql<{
        orders: {
          items: Array<{
            id: string;
            status: OrderStatus;
            delivery?: { driverId: string | null } | null;
          }>;
        };
      }>(
        app,
        `query {
          orders(page: 1, limit: 50) {
            items { id status delivery { driverId } }
          }
        }`,
        undefined,
        adminToken,
      );
      expectGqlOk(list);

      const driverUserId = (
        await gql<{ me: { id: string } }>(
          app,
          `query { me { id } }`,
          undefined,
          driverToken,
        )
      ).data?.me.id;

      for (const order of list.data.orders.items) {
        if (
          order.delivery?.driverId &&
          order.delivery.driverId !== driverUserId &&
          !foreignOrderId
        ) {
          foreignOrderId = order.id;
        }
        if (
          order.delivery?.driverId === driverUserId &&
          order.status !== OrderStatus.CANCELLED &&
          order.status !== OrderStatus.DELIVERED &&
          !driverAssignedOrderId
        ) {
          driverAssignedOrderId = order.id;
        }
      }
    });

    it('client ne peut pas changer le statut d\'une commande', async () => {
      if (!foreignOrderId) {
        console.warn('Skip: pas de commande disponible pour test client IDOR');
        return;
      }
      const body = await gql(
        app,
        `mutation Update($input: UpdateOrderStatusInput!) {
          updateOrderStatus(input: $input) { id status }
        }`,
        { input: { id: foreignOrderId, status: OrderStatus.CONFIRMED } },
        clientToken,
      );
      expectGqlForbidden(body);
    });

    it('livreur ne peut pas modifier une commande non assignée', async () => {
      if (!foreignOrderId) {
        console.warn('Skip: pas de commande assignée à un autre livreur');
        return;
      }
      const body = await gql(
        app,
        `mutation Update($input: UpdateOrderStatusInput!) {
          updateOrderStatus(input: $input) { id status }
        }`,
        { input: { id: foreignOrderId, status: OrderStatus.IN_TRANSIT } },
        driverToken,
      );
      expectGqlForbidden(body);
    });

    it('admin peut toujours modifier une commande', async () => {
      if (!foreignOrderId) {
        console.warn('Skip: pas de commande pour test admin');
        return;
      }
      const peek = await gql<{ order: { status: OrderStatus } }>(
        app,
        `query Order($id: ID!) { order(id: $id) { status } }`,
        { id: foreignOrderId },
        adminToken,
      );
      expectGqlOk(peek);

      const body = await gql<{ updateOrderStatus: { id: string; status: string } }>(
        app,
        `mutation Update($input: UpdateOrderStatusInput!) {
          updateOrderStatus(input: $input) { id status }
        }`,
        {
          input: {
            id: foreignOrderId,
            status: peek.data.order.status,
          },
        },
        adminToken,
      );
      expectGqlOk(body);
    });
  });

  describe('Endpoints publics — surface acceptable', () => {
    it('searchMenuItems accessible sans auth (catalogue public)', async () => {
      const body = await gql<{ searchMenuItems: { items: unknown[] } }>(
        app,
        `query { searchMenuItems(page: 1, limit: 5) { items { id name } } }`,
      );
      expectGqlOk(body);
    });

    it('reviewsByRestaurant accessible sans auth', async () => {
      const restaurants = await gql<{
        searchRestaurants: { items: Array<{ id: string }> };
      }>(
        app,
        `query { searchRestaurants(page: 1, limit: 1) { items { id } } }`,
      );
      expectGqlOk(restaurants);
      const restaurantId = restaurants.data.searchRestaurants.items[0]?.id;
      if (!restaurantId) {
        console.warn('Skip: aucun restaurant en base');
        return;
      }

      const body = await gql(
        app,
        `query Reviews($id: ID!) {
          reviewsByRestaurant(restaurantId: $id, page: 1, limit: 5) {
            items { id rating }
          }
        }`,
        { id: restaurantId },
      );
      expectGqlOk(body);
    });
  });

  describe('Scoping PARTNER — restaurant lié', () => {
    let partnerToken: string;

    beforeAll(async () => {
      try {
        partnerToken = await loginAs(app, PARTNER_PHONE, PARTNER_PASSWORD);
      } catch {
        console.warn(
          'Skip partner tests: compte partenaire absent — lancer prisma db push && npm run db:seed',
        );
      }
    });

    it('partenaire ne voit que les commandes de son restaurant', async () => {
      if (!partnerToken) return;

      const body = await gql<{
        orders: { items: Array<{ restaurant?: { id: string } | null }> };
      }>(
        app,
        `query {
          orders(page: 1, limit: 20) {
            items { id restaurant { id name } }
          }
        }`,
        undefined,
        partnerToken,
      );
      expectGqlOk(body);
      for (const order of body.data.orders.items) {
        expect(order.restaurant?.id).toBe(PARTNER_RESTAURANT_ID);
      }
    });

    it('partenaire ne peut pas modifier le menu d\'un autre restaurant', async () => {
      if (!partnerToken) return;

      const menus = await gql<{
        menuItemsByRestaurant: { items: Array<{ id: string }> };
      }>(
        app,
        `query Menus($id: ID!) {
          menuItemsByRestaurant(restaurantId: $id, page: 1, limit: 1) {
            items { id name }
          }
        }`,
        { id: OTHER_RESTAURANT_ID },
      );
      expectGqlOk(menus);
      const foreignItemId = menus.data.menuItemsByRestaurant.items[0]?.id;
      if (!foreignItemId) {
        console.warn('Skip: pas de plat sur le restaurant pizza');
        return;
      }

      const body = await gql(
        app,
        `mutation Update($input: UpdateMenuItemInput!) {
          updateMenuItem(input: $input) { id }
        }`,
        {
          input: {
            id: foreignItemId,
            name: 'Hack attempt',
          },
        },
        partnerToken,
      );
      expectGqlForbidden(body);
    });

    it('partenaire ne peut pas créer de restaurant', async () => {
      if (!partnerToken) return;

      const body = await gql(
        app,
        `mutation Create($input: CreateRestaurantInput!) {
          createRestaurant(input: $input) { id }
        }`,
        {
          input: {
            name: 'Fake Resto',
            address: 'Test',
            city: 'Brazzaville',
            zipCode: '00000',
            phone: '+242060000000',
            cuisineType: 'Test',
          },
        },
        partnerToken,
      );
      expectGqlForbidden(body);
    });

    it('partenaire ne peut pas accéder au CMS admin', async () => {
      if (!partnerToken) return;

      const body = await gql(
        app,
        `query { allHomeBanners { id title } }`,
        undefined,
        partnerToken,
      );
      expectGqlForbidden(body);
    });
  });
});
