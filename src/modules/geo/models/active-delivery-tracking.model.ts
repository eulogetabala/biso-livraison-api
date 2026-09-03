import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
import { DeliveryStatus, OrderStatus } from '@prisma/client';

@ObjectType()
export class ActiveDeliveryTrackingModel {
  @Field(() => ID)
  deliveryId: string;

  @Field(() => ID, { nullable: true })
  orderId?: string;

  @Field(() => ID, { nullable: true })
  parcelId?: string;

  @Field(() => DeliveryStatus)
  deliveryStatus: DeliveryStatus;

  @Field(() => OrderStatus, { nullable: true })
  orderStatus?: OrderStatus;

  @Field(() => ID)
  driverId: string;

  @Field()
  driverFirstName: string;

  @Field()
  driverLastName: string;

  @Field({ nullable: true })
  driverPhone?: string;

  @Field(() => Float, { nullable: true })
  driverLatitude?: number;

  @Field(() => Float, { nullable: true })
  driverLongitude?: number;

  @Field({ nullable: true })
  locationUpdatedAt?: Date;

  @Field()
  restaurantName: string;

  @Field(() => Float, { nullable: true })
  restaurantLatitude?: number;

  @Field(() => Float, { nullable: true })
  restaurantLongitude?: number;

  @Field()
  deliveryAddress: string;

  @Field()
  deliveryCity: string;

  @Field(() => Float, { nullable: true })
  deliveryLatitude?: number;

  @Field(() => Float, { nullable: true })
  deliveryLongitude?: number;

  @Field()
  clientFirstName: string;

  @Field()
  clientLastName: string;
}
