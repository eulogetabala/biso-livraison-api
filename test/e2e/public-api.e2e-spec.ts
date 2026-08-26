import { INestApplication } from '@nestjs/common';
import { createE2eApp } from '../helpers/app.helper';
import { gql, expectGqlOk } from '../helpers/graphql.helper';

describe('Public API — Restaurants & Menus (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createE2eApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('searchRestaurants → liste paginée', async () => {
    const body = await gql<{
      searchRestaurants: {
        items: Array<{ id: string; name: string }>;
        pageInfo: { totalItems: number; currentPage: number };
      };
    }>(
      app,
      `query SearchRestaurants($page: Int, $limit: Int) {
        searchRestaurants(page: $page, limit: $limit) {
          items { id name cuisineType city isActive }
          pageInfo { totalItems totalPages currentPage hasNextPage }
        }
      }`,
      { page: 1, limit: 10 },
    );
    expectGqlOk(body);
    expect(Array.isArray(body.data.searchRestaurants.items)).toBe(true);
    expect(body.data.searchRestaurants.pageInfo.currentPage).toBe(1);
  });

  it('restaurants → liste paginée', async () => {
    const body = await gql<{
      restaurants: {
        items: Array<{ id: string }>;
        pageInfo: { totalItems: number };
      };
    }>(
      app,
      `query Restaurants($page: Int, $limit: Int) {
        restaurants(page: $page, limit: $limit) {
          items { id name }
          pageInfo { totalItems currentPage }
        }
      }`,
      { page: 1, limit: 5 },
    );
    expectGqlOk(body);
    expect(Array.isArray(body.data.restaurants.items)).toBe(true);
  });

  it('searchMenuItems → liste paginée', async () => {
    const body = await gql<{
      searchMenuItems: {
        items: Array<{ id: string; name: string }>;
        pageInfo: { totalItems: number };
      };
    }>(
      app,
      `query SearchMenuItems($page: Int, $limit: Int) {
        searchMenuItems(page: $page, limit: $limit) {
          items { id name price category }
          pageInfo { totalItems currentPage }
        }
      }`,
      { page: 1, limit: 10 },
    );
    expectGqlOk(body);
    expect(Array.isArray(body.data.searchMenuItems.items)).toBe(true);
  });

  it('restaurant inexistant → erreur', async () => {
    const body = await gql(
      app,
      `query Restaurant($id: ID!) {
        restaurant(id: $id) { id name }
      }`,
      { id: '00000000-0000-0000-0000-000000000000' },
    );
    expect(body.errors?.length).toBeGreaterThan(0);
  });
});
