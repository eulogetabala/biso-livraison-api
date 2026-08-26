import request from 'supertest';
import { INestApplication } from '@nestjs/common';

export type GqlResponse<T = unknown> = {
  data?: T;
  errors?: Array<{ message: string; extensions?: Record<string, unknown> }>;
};

export async function gql<T = unknown>(
  app: INestApplication,
  query: string,
  variables?: Record<string, unknown>,
  token?: string,
): Promise<GqlResponse<T>> {
  const req = request(app.getHttpServer())
    .post('/graphql')
    .send({ query, variables });

  if (token) {
    req.set('Authorization', `Bearer ${token}`);
  }

  const res = await req.expect(200);
  return res.body as GqlResponse<T>;
}

export function expectGqlOk<T>(body: GqlResponse<T>): asserts body is { data: T } {
  if (body.errors?.length) {
    throw new Error(
      `GraphQL errors: ${body.errors.map((e) => e.message).join('; ')}`,
    );
  }
  expect(body.data).toBeDefined();
}

export async function loginAs(
  app: INestApplication,
  phone: string,
  password: string,
): Promise<string> {
  const body = await gql<{ login: { accessToken: string } }>(
    app,
    `mutation Login($input: LoginInput!) {
      login(input: $input) { accessToken }
    }`,
    { input: { phone, password } },
  );
  expectGqlOk(body);
  return body.data.login.accessToken;
}

export async function registerUser(
  app: INestApplication,
  input: {
    phone: string;
    password: string;
    firstName: string;
    lastName: string;
  },
): Promise<void> {
  const body = await gql(
    app,
    `mutation Register($input: CreateUserInput!) {
      createUser(input: $input) { id phone }
    }`,
    { input: { ...input, phoneVerified: true } },
  );
  expectGqlOk(body);
}
