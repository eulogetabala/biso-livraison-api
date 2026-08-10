import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
import { DeliveryStatus } from '@prisma/client';
import { DeliveryModel } from '../../deliveries/models/delivery.model';

@ObjectType()
export class TrackingEventModel {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  deliveryId: string;

  @Field(() => DeliveryStatus)
  status: DeliveryStatus;

  @Field({ nullable: true })
  message?: string;

  @Field(() => Float, { nullable: true })
  latitude?: number;

  @Field(() => Float, { nullable: true })
  longitude?: number;

  @Field(() => DeliveryModel, { nullable: true })
  delivery?: DeliveryModel;

  @Field()
  createdAt: Date;
}
