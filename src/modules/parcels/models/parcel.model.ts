import {
  Field,
  Float,
  ID,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { ParcelStatus } from '@prisma/client';
import { UserModel } from '../../users/models/user.model';

registerEnumType(ParcelStatus, {
  name: 'ParcelStatus',
  description: 'Current status of a parcel',
});

@ObjectType()
export class ParcelModel {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  senderId: string;

  @Field()
  receiverName: string;

  @Field()
  receiverPhone: string;

  @Field()
  receiverAddress: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Float)
  weight: number;

  @Field(() => ParcelStatus)
  status: ParcelStatus;

  @Field({ nullable: true })
  deliveredAt?: Date;

  @Field(() => UserModel, { nullable: true })
  sender?: UserModel;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
