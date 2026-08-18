import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { UserModel } from '../../users/models/user.model';

@ObjectType()
export class DriverModel {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field()
  vehicleType: string;

  @Field({ nullable: true })
  vehiclePlate?: string;

  @Field()
  isAvailable: boolean;

  @Field()
  rating: number;

  @Field(() => Int)
  reviewCount: number;

  @Field(() => UserModel, { nullable: true })
  user?: UserModel;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
