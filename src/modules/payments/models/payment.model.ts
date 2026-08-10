import {
  Field,
  Float,
  ID,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { OrderModel } from '../../orders/models/order.model';

registerEnumType(PaymentMethod, {
  name: 'PaymentMethod',
  description: 'Payment method used for an order',
});

registerEnumType(PaymentStatus, {
  name: 'PaymentStatus',
  description: 'Current status of a payment',
});

@ObjectType()
export class PaymentModel {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  orderId: string;

  @Field(() => PaymentMethod)
  method: PaymentMethod;

  @Field(() => PaymentStatus)
  status: PaymentStatus;

  @Field(() => Float)
  amount: number;

  @Field({ nullable: true })
  paidAt?: Date;

  @Field(() => OrderModel, { nullable: true })
  order?: OrderModel;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
