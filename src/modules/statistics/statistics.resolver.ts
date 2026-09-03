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
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.PARTNER)
export class StatisticsResolver {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Query(() => StatisticsOverviewModel)
  statisticsOverview(
    @Args('range', { nullable: true }) range?: StatisticsRangeInput,
    @CurrentUser() user?: CurrentUser,
  ) {
    return this.statisticsService.overview(range ?? {}, user);
  }

  @Query(() => [RevenueByRestaurantModel])
  revenueByRestaurant(
    @Args('range', { nullable: true }) range?: StatisticsRangeInput,
    @CurrentUser() user?: CurrentUser,
  ) {
    return this.statisticsService.revenueByRestaurant(range ?? {}, user);
  }

  @Query(() => [OrdersByStatusModel])
  ordersByStatus(
    @Args('range', { nullable: true }) range?: StatisticsRangeInput,
    @CurrentUser() user?: CurrentUser,
  ) {
    return this.statisticsService.ordersByStatus(range ?? {}, user);
  }

  @Query(() => [DailyOrdersModel])
  dailyOrders(
    @Args('range', { nullable: true }) range?: StatisticsRangeInput,
    @CurrentUser() user?: CurrentUser,
  ) {
    return this.statisticsService.dailyOrders(range ?? {}, user);
  }

  @Query(() => [RevenueByRestaurantModel])
  topRestaurants(
    @Args('input', { nullable: true }) input?: TopRestaurantsInput,
    @CurrentUser() user?: CurrentUser,
  ) {
    return this.statisticsService.topRestaurants(input ?? {}, user);
  }
}
