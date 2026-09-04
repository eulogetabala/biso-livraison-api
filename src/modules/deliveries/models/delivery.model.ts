import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { DeliveryStatus } from '@prisma/client';
import { OrderModel } from '../../orders/models/order.model';
import { ParcelModel } from '../../parcels/models/parcel.model';
import { UserModel } from '../../users/models/user.model';

registerEnumType(DeliveryStatus, {
  name: 'DeliveryStatus',
  description: 'Current status of a delivery',
});

@ObjectType()
export class DeliveryModel {
  @Field(() => ID)
  id: string;

  @Field(() => ID, { nullable: true })
  orderId?: string;

  @Field(() => ID, { nullable: true })
  parcelId?: string;

  @Field(() => ID)
  driverId: string;

  @Field(() => DeliveryStatus)
  status: DeliveryStatus;

  @Field({ nullable: true })
  pickedUpAt?: Date;

  @Field({ nullable: true })
  deliveredAt?: Date;

  @Field(() => OrderModel, { nullable: true })
  order?: OrderModel;

  @Field(() => ParcelModel, { nullable: true })
  parcel?: ParcelModel;

  @Field(() => UserModel, { nullable: true })
  driver?: UserModel;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
