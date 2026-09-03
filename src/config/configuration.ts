import type { JwtModuleOptions } from '@nestjs/jwt';

export type JwtExpiresIn = NonNullable<
  JwtModuleOptions['signOptions']
>['expiresIn'];

export interface AppConfig {
  app: {
    name: string;
    nodeEnv: string;
    isProduction: boolean;
    port: number;
  };
  database: {
    url: string;
    poolMax: number;
  };
  throttler: {
    defaultLimit: number;
    defaultTtlMs: number;
  };
  jwt: {
    secret: string;
    refreshSecret: string;
    expiresIn: JwtExpiresIn;
  };
  mail: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    from: string;
  };
  redis: {
    url: string;
  };
  firebase: {
    projectId: string;
    clientEmail: string;
    privateKey: string;
  };
  twilio: {
    accountSid: string;
    authToken: string;
    fromNumber: string;
    verifyServiceSid: string;
    verifyFriendlyName: string;
    allowTestOtp: boolean;
  };
  uploads: {
    directory: string;
    publicUrl: string;
  };
}

export default (): AppConfig => {
  const nodeEnv = process.env.NODE_ENV ?? 'development';

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined');
  }

  return {
    app: {
      name: process.env.APP_NAME ?? 'Delivery Platform',
      nodeEnv,
      isProduction: nodeEnv === 'production',
      port: parseInt(process.env.PORT ?? '3001', 10),
    },
    database: {
      url: process.env.DATABASE_URL ?? '',
      poolMax: parseInt(process.env.DB_POOL_MAX ?? '10', 10),
    },
    throttler: {
      defaultLimit: parseInt(process.env.THROTTLE_DEFAULT_LIMIT ?? '120', 10),
      defaultTtlMs: parseInt(process.env.THROTTLE_DEFAULT_TTL_MS ?? '60000', 10),
    },
    jwt: {
      secret: jwtSecret,
      refreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
      expiresIn: (process.env.JWT_EXPIRES_IN ?? '15m') as JwtExpiresIn,
    },
    mail: {
      host: process.env.SMTP_HOST ?? '',
      port: parseInt(process.env.SMTP_PORT ?? '587', 10),
      secure: (process.env.SMTP_SECURE ?? 'false') === 'true',
      user: process.env.SMTP_USER ?? '',
      pass: process.env.SMTP_PASS ?? '',
      from: process.env.MAIL_FROM ?? 'no-reply@biso-livraison.app',
    },
    redis: {
      url: process.env.REDIS_URL ?? 'redis://localhost:6379',
    },
    firebase: {
      projectId: process.env.FIREBASE_PROJECT_ID ?? '',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? '',
      privateKey: process.env.FIREBASE_PRIVATE_KEY ?? '',
    },
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID ?? '',
      authToken: process.env.TWILIO_AUTH_TOKEN ?? '',
      fromNumber: process.env.TWILIO_FROM_NUMBER ?? '',
      verifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID ?? '',
      verifyFriendlyName: process.env.TWILIO_VERIFY_FRIENDLY_NAME ?? 'Biso Livraison',
      allowTestOtp:
        process.env.ALLOW_TEST_OTP === 'true' ||
        (process.env.NODE_ENV ?? 'development') !== 'production',
    },
    uploads: {
      directory: process.env.UPLOAD_DIR ?? 'public/uploads',
      publicUrl: process.env.PUBLIC_UPLOAD_URL ?? '/uploads',
    },
  };
};
