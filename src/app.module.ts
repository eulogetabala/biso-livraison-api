import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLError } from 'graphql';
import { PrismaModule } from './prisma/prisma.module';
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
import configuration, { AppConfig } from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig>) => {
        const isProduction =
          configService.getOrThrow<AppConfig['app']>('app').isProduction;

        return {
          autoSchemaFile: true,
          includeStacktraceInErrorResponses: !isProduction,
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
  ],
})
export class AppModule {}
