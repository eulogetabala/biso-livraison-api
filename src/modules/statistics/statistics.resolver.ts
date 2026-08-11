import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { StatisticsService } from './statistics.service';
import {
  DailyOrdersModel,
  OrdersByStatusModel,
  RevenueByRestaurantModel,
  StatisticsOverviewModel,
} from './models/statistics.models';
import {
  StatisticsRangeInput,
  TopRestaurantsInput,
} from './dto/statistics.inputs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Resolver()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.PARTNER)
export class StatisticsResolver {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Query(() => StatisticsOverviewModel)
  statisticsOverview() {
    return this.statisticsService.overview();
  }

  @Query(() => [RevenueByRestaurantModel])
  revenueByRestaurant(
    @Args('range', { nullable: true }) range?: StatisticsRangeInput,
  ) {
    return this.statisticsService.revenueByRestaurant(range ?? {});
  }

  @Query(() => [OrdersByStatusModel])
  ordersByStatus() {
    return this.statisticsService.ordersByStatus();
  }

  @Query(() => [DailyOrdersModel])
  dailyOrders(@Args('range', { nullable: true }) range?: StatisticsRangeInput) {
    return this.statisticsService.dailyOrders(range ?? {});
  }

  @Query(() => [RevenueByRestaurantModel])
  topRestaurants(
    @Args('input', { nullable: true }) input?: TopRestaurantsInput,
  ) {
    return this.statisticsService.topRestaurants(input ?? {});
  }
}
