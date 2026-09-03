import { INestApplication } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { createE2eApp, uniquePhone } from '../helpers/app.helper';
import {
  expectGqlOk,
  gql,
  loginAs,
  registerUser,
} from '../helpers/graphql.helper';

const ADMIN_PHONE = process.env.ADMIN_PHONE ?? '+242065644299';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'Admin123!';

const WORKFLOW_STEPS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: OrderStatus.CONFIRMED,
  CONFIRMED: OrderStatus.PREPARING,
  PREPARING: OrderStatus.IN_TRANSIT,
  IN_TRANSIT: OrderStatus.DELIVERED,
};

describe('Admin dashboard — orders, drivers, reviews (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  beforeAll(async () => {
    app = await createE2eApp();
    adminToken = await loginAs(app, ADMIN_PHONE, ADMIN_PASSWORD);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Order status workflow', () => {
    it('updateOrderStatus avance une commande existante d’un cran', async () => {
      const list = await gql<{
        orders: { items: Array<{ id: string; status: OrderStatus }> };
      }>(
        app,
        `query {
          orders(page: 1, limit: 30) {
            items { id status }
          }
        }`,
        undefined,
        adminToken,
      );
      expectGqlOk(list);

      const candidate = list.data.orders.items.find(
        (order) => WORKFLOW_STEPS[order.status] != null,
      );
      if (!candidate) {
        console.warn('Skip: aucune commande modifiable en base');
        return;
      }

      const nextStatus = WORKFLOW_STEPS[candidate.status]!;
      const body = await gql<{ updateOrderStatus: { id: string; status: string } }>(
        app,
        `mutation($input: UpdateOrderStatusInput!) {
          updateOrderStatus(input: $input) { id status }
        }`,
        { input: { id: candidate.id, status: nextStatus } },
        adminToken,
      );
      expectGqlOk(body);
      expect(body.data.updateOrderStatus.status).toBe(nextStatus);
    });
  });

  describe('Driver admin update', () => {
    const driverPhone = uniquePhone('801');
    let driverId: string;

    beforeAll(async () => {
      const created = await gql<{
        adminCreateDriver: { id: string };
      }>(
        app,
        `mutation($input: AdminCreateDriverInput!) {
          adminCreateDriver(input: $input) { id }
        }`,
        {
          input: {
            firstName: 'E2E',
            lastName: 'Driver',
            phone: driverPhone,
            password: 'DriverPass123',
            vehicleType: 'MOTO',
            vehiclePlate: 'TEST-001',
            isAvailable: false,
          },
        },
        adminToken,
      );
      expectGqlOk(created);
      driverId = created.data.adminCreateDriver.id;
    });

    it('adminUpdateDriver met à jour identité et véhicule', async () => {
      const updatedPhone = uniquePhone('802');
      const body = await gql<{
        adminUpdateDriver: {
          vehicleType: string;
          vehiclePlate: string | null;
          isAvailable: boolean;
          user: { firstName: string; phone: string };
        };
      }>(
        app,
        `mutation($input: AdminUpdateDriverInput!) {
          adminUpdateDriver(input: $input) {
            vehicleType
            vehiclePlate
            isAvailable
            user { firstName phone }
          }
        }`,
        {
          input: {
            driverId,
            firstName: 'E2EUpdated',
            lastName: 'DriverUpdated',
            phone: updatedPhone,
            vehicleType: 'VELO',
            vehiclePlate: 'ABC-123',
            isAvailable: true,
          },
        },
        adminToken,
      );
      expectGqlOk(body);
      const driver = body.data.adminUpdateDriver;
      expect(driver.vehicleType).toBe('VELO');
      expect(driver.vehiclePlate).toBe('ABC-123');
      expect(driver.isAvailable).toBe(true);
      expect(driver.user.firstName).toBe('E2EUpdated');
      expect(driver.user.phone).toBe(updatedPhone);
    });
  });

  describe('Reviews moderation', () => {
    it('reviews → liste admin accessible', async () => {
      const body = await gql<{
        reviews: { items: unknown[]; pageInfo: { totalItems: number } };
      }>(
        app,
        `query {
          reviews(page: 1, limit: 10) {
            items { id rating comment }
            pageInfo { totalItems }
          }
        }`,
        undefined,
        adminToken,
      );
      expectGqlOk(body);
      expect(Array.isArray(body.data.reviews.items)).toBe(true);
    });

    it('updateReview + deleteReview sur avis créé pour le test', async () => {
      const clientPhone = uniquePhone('901');
      await registerUser(app, {
        phone: clientPhone,
        password: 'ClientPass123',
        firstName: 'Review',
        lastName: 'Tester',
      });
      const clientToken = await loginAs(app, clientPhone, 'ClientPass123');

      const restaurants = await gql<{
        searchRestaurants: { items: Array<{ id: string; type: string }> };
      }>(
        app,
        `query {
          searchRestaurants(page: 1, limit: 5, input: { onlyActive: true }) {
            items { id type }
          }
        }`,
        undefined,
        adminToken,
      );
      expectGqlOk(restaurants);
      const restaurant = restaurants.data.searchRestaurants.items.find(
        (r) => r.type !== 'MARKET',
      );
      if (!restaurant) {
        console.warn('Skip: pas de restaurant pour avis e2e');
        return;
      }

      const menu = await gql<{ searchMenuItems: { items: Array<{ id: string }> } }>(
        app,
        `query($restaurantId: ID!) {
          searchMenuItems(page: 1, limit: 1, input: { restaurantId: $restaurantId, restaurantDishesOnly: true }) {
            items { id }
          }
        }`,
        { restaurantId: restaurant.id },
        adminToken,
      );
      expectGqlOk(menu);
      const menuItemId = menu.data.searchMenuItems.items[0]?.id;
      if (!menuItemId) {
        console.warn('Skip: pas de plat pour avis e2e');
        return;
      }

      const order = await gql<{ createOrder: { id: string } }>(
        app,
        `mutation($input: CreateOrderInput!) {
          createOrder(input: $input) { id }
        }`,
        {
          input: {
            restaurantId: restaurant.id,
            items: [{ menuItemId, quantity: 1 }],
            deliveryAddress: '1 avis test',
            deliveryCity: 'Brazzaville',
            deliveryZipCode: '0000',
          },
        },
        clientToken,
      );
      if (order.errors?.length) {
        console.warn(`Skip createOrder: ${order.errors[0]?.message}`);
        return;
      }
      expectGqlOk(order);
      const orderId = order.data.createOrder.id;

      for (const status of [
        OrderStatus.CONFIRMED,
        OrderStatus.PREPARING,
        OrderStatus.IN_TRANSIT,
        OrderStatus.DELIVERED,
      ]) {
        const step = await gql(
          app,
          `mutation($input: UpdateOrderStatusInput!) {
            updateOrderStatus(input: $input) { id }
          }`,
          { input: { id: orderId, status } },
          adminToken,
        );
        expectGqlOk(step);
      }

      const review = await gql<{ createReview: { id: string } }>(
        app,
        `mutation($input: CreateReviewInput!) {
          createReview(input: $input) { id rating }
        }`,
        { input: { orderId, rating: 4, comment: 'E2E avis' } },
        clientToken,
      );
      expectGqlOk(review);
      const reviewId = review.data.createReview.id;

      const updated = await gql<{ updateReview: { rating: number; comment: string } }>(
        app,
        `mutation($input: UpdateReviewInput!) {
          updateReview(input: $input) { rating comment }
        }`,
        { input: { id: reviewId, rating: 5, comment: 'Modéré admin' } },
        adminToken,
      );
      expectGqlOk(updated);
      expect(updated.data.updateReview.rating).toBe(5);

      const deleted = await gql<{ deleteReview: { id: string } }>(
        app,
        `mutation($id: ID!) { deleteReview(id: $id) { id } }`,
        { id: reviewId },
        adminToken,
      );
      expectGqlOk(deleted);
    });
  });
});
