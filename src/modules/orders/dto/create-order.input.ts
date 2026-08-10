import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { PaymentMethod } from '@prisma/client';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

@InputType()
export class CreateOrderItemInput {
  @Field(() => ID)
  @IsUUID()
  menuItemId: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(100)
  quantity: number;
}

@InputType()
export class CreateOrderInput {
  @Field(() => ID)
  @IsUUID()
  restaurantId: string;

  @Field(() => [CreateOrderItemInput])
  @IsArray()
  @ArrayMinSize(1)
  items: CreateOrderItemInput[];

  @Field(() => PaymentMethod, {
    nullable: true,
    defaultValue: PaymentMethod.CASH_ON_DELIVERY,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;
}
