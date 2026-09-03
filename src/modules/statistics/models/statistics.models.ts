import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { OrderStatus } from '@prisma/client';

@ObjectType()
export class StatisticsOverviewModel {
  @Field(() => Int)
  totalOrders: number;

  @Field(() => Float)
  totalRevenue: number;

  @Field(() => Float)
  averageOrderValue: number;

  @Field(() => Int)
  activeRestaurants: number;

  @Field(() => Int)
  activeDrivers: number;

  @Field(() => Int)
  pendingOrders: number;

  @Field(() => Int)
  totalDriverProfiles: number;

  @Field(() => Int)
  availableDriverProfiles: number;
}

@ObjectType()
export class RevenueByRestaurantModel {
  @Field(() => ID)
  restaurantId: string;

  @Field()
  restaurantName: string;

  @Field(() => Float)
  revenue: number;

  @Field(() => Int)
  orderCount: number;
}

@ObjectType()
export class OrdersByStatusModel {
  @Field(() => OrderStatus)
  status: OrderStatus;

  @Field(() => Int)
  count: number;
}

@ObjectType()
export class DailyOrdersModel {
  @Field()
  date: string;

  @Field(() => Int)
  orders: number;

  @Field(() => Float)
  revenue: number;
}
