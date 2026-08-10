import { Field, ID, InputType } from '@nestjs/graphql';
import { DeliveryStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';

@InputType()
export class UpdateDeliveryStatusInput {
  @Field(() => ID)
  @IsUUID()
  id: string;

  @Field(() => DeliveryStatus)
  @IsEnum(DeliveryStatus)
  @IsNotEmpty()
  status: DeliveryStatus;
}
