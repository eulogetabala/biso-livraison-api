import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ThrottlerModule } from '@nestjs/throttler';
import { GraphQLError } from 'graphql';
import depthLimit from 'graphql-depth-limit';
import { join } from 'path';
import { GqlThrottlerGuard } from './common/guards/gql-throttler.guard';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { RestaurantsModule } from './modules/restaurants/restaurants.module';
import { MenusModule } from './modules/menus/menus.module';
import { OrdersModule } from './modules/orders/orders.module';
import { DeliveriesModule } from './modules/deliveries/deliveries.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { ParcelsModule } from './modules/parcels/parcels.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { StatisticsModule } from './modules/statistics/statistics.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { GeoModule } from './modules/geo/geo.module';
import { MailModule } from './modules/mail/mail.module';
import { SmsModule } from './modules/sms/sms.module';
import { OtpModule } from './modules/otp/otp.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { CmsModule } from './modules/cms/cms.module';
import { HealthModule } from './modules/health/health.module';
import configuration, { AppConfig } from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig>) => {
        const throttler = configService.getOrThrow<AppConfig['throttler']>('throttler');
        return [
          { name: 'default', ttl: throttler.defaultTtlMs, limit: throttler.defaultLimit },
          { name: 'auth', ttl: 60_000, limit: 10 },
          { name: 'otp', ttl: 60_000, limit: 5 },
          { name: 'register', ttl: 3_600_000, limit: 5 },
          { name: 'gps', ttl: 3_000, limit: 1 },
        ];
      },
    }),

    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig>) => {
        const isProduction =
          configService.getOrThrow<AppConfig['app']>('app').isProduction;

        return {
          autoSchemaFile: join(process.cwd(), 'docs/schema.graphql'),
          sortSchema: true,
          introspection: !isProduction,
          includeStacktraceInErrorResponses: !isProduction,
          validationRules: [depthLimit(12)],
          formatError: (error: GraphQLError) => {
            // Keep user-facing validation/authorization messages intact
            // but strip internal stack traces in production.
            const extensions = { ...error.extensions };
            if (isProduction) {
              delete extensions.stacktrace;
            }
            return {
              message: error.message,
              extensions,
            };
          },
        };
      },
    }),

    PrismaModule,
    RedisModule,
    UsersModule,
    AuthModule,
    RestaurantsModule,
    MenusModule,
    OrdersModule,
    DeliveriesModule,
    ReviewsModule,
    DriversModule,
    TrackingModule,
    ParcelsModule,
    PaymentsModule,
    StatisticsModule,
    NotificationsModule,
    GeoModule,
    MailModule,
    SmsModule,
    OtpModule,
    UploadsModule,
    FavoritesModule,
    CmsModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: GqlThrottlerGuard,
    },
  ],
})
export class AppModule {}
