import { Field, Float, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class DriverLocationModel {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  driverId: string;

  @Field(() => Float)
  latitude: number;

  @Field(() => Float)
  longitude: number;

  @Field(() => ID, { nullable: true })
  deliveryId?: string;

  @Field()
  updatedAt: Date;
}
