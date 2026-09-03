import { Field, InputType } from '@nestjs/graphql';
import { OrderStatus, RestaurantType } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

@InputType()
export class SearchOrdersInput {
  @Field(() => OrderStatus, { nullable: true })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @Field(() => RestaurantType, { nullable: true })
  @IsOptional()
  @IsEnum(RestaurantType)
  restaurantType?: RestaurantType;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  from?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  to?: string;
}
