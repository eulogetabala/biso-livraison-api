import { Field, ID, InputType } from '@nestjs/graphql';
import { OrderStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';

@InputType()
export class UpdateOrderStatusInput {
  @Field(() => ID)
  @IsUUID()
  id: string;

  @Field(() => OrderStatus)
  @IsEnum(OrderStatus)
  @IsNotEmpty()
  status: OrderStatus;
}
