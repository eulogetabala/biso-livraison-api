import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { PaymentMethod } from '@prisma/client';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
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

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  deliveryAddress: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  deliveryCity: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  deliveryZipCode: string;

  @Field(() => PaymentMethod, {
    nullable: true,
    defaultValue: PaymentMethod.CASH_ON_DELIVERY,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @IsLatitude({ message: 'deliveryLatitude must be between -90 and 90' })
  deliveryLatitude?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @IsLongitude({ message: 'deliveryLongitude must be between -180 and 180' })
  deliveryLongitude?: number;
}
