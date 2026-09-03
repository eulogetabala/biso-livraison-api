import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { RestaurantModel } from '../../restaurants/models/restaurant.model';

registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'Rôle utilisateur (client, livreur, admin…)',
});

@ObjectType()
export class UserModel {
  @Field(() => ID)
  id: string;

  @Field(() => String, { nullable: true })
  email: string | null;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  phone: string;

  @Field()
  phoneVerified: boolean;

  @Field()
  isBlocked: boolean;

  @Field({ nullable: true })
  avatarUrl?: string;

  @Field(() => UserRole)
  role: UserRole;

  @Field(() => ID, { nullable: true })
  partnerRestaurantId?: string | null;

  @Field(() => RestaurantModel, { nullable: true })
  partnerRestaurant?: RestaurantModel | null;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
