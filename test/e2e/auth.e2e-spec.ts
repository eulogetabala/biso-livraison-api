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

describe('Auth & OTP (e2e)', () => {
  let app: INestApplication;
  const password = 'TestPass123';
  let phone: string;

  beforeAll(async () => {
    app = await createE2eApp();
    phone = uniquePhone('101');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('requestOtp / verifyOtp', () => {
    it('requestOtp → retourne phone et expiresIn', async () => {
      const otpPhone = uniquePhone('102');
      const body = await gql<{ requestOtp: { phone: string; expiresIn: number } }>(
        app,
        `mutation RequestOtp($input: RequestOtpInput!) {
          requestOtp(input: $input) { phone expiresIn devCode }
        }`,
        { input: { phone: otpPhone } },
      );
      expectGqlOk(body);
      expect(body.data.requestOtp.phone).toContain('+242');
      expect(body.data.requestOtp.expiresIn).toBeGreaterThan(0);
    });
  });

  describe('createUser + login', () => {
    beforeAll(async () => {
      await registerUser(app, {
        phone,
        password,
        firstName: 'E2E',
        lastName: 'Auth',
      });
    });

    it('login → retourne accessToken et user', async () => {
      const body = await gql<{
        login: {
          accessToken: string;
          user: { phone: string; firstName: string };
        };
      }>(
        app,
        `mutation Login($input: LoginInput!) {
          login(input: $input) {
            accessToken
            user { id phone firstName lastName role }
          }
        }`,
        { input: { phone, password } },
      );
      expectGqlOk(body);
      expect(body.data.login.accessToken).toBeTruthy();
      expect(body.data.login.user.phone).toBe(phone);
      expect(body.data.login.user.firstName).toBe('E2E');
    });

    it('login avec mauvais mot de passe → erreur', async () => {
      const body = await gql(
        app,
        `mutation Login($input: LoginInput!) {
          login(input: $input) { accessToken }
        }`,
        { input: { phone, password: 'wrong-password' } },
      );
      expect(body.errors?.length).toBeGreaterThan(0);
    });

    it('me → retourne le profil authentifié', async () => {
      const token = await loginAs(app, phone, password);
      const body = await gql<{ me: { phone: string; firstName: string } }>(
        app,
        `query Me { me { id phone firstName lastName role } }`,
        undefined,
        token,
      );
      expectGqlOk(body);
      expect(body.data.me.phone).toBe(phone);
    });
  });
});
