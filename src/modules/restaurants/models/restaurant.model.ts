import { Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { RestaurantType } from '@prisma/client';

registerEnumType(RestaurantType, {
  name: 'RestaurantType',
  description: 'Restaurant business type',
});

@ObjectType()
export class RestaurantModel {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  address: string;

  @Field()
  city: string;

  @Field()
  zipCode: string;

  @Field()
  phone: string;

  @Field()
  cuisineType: string;

  @Field({ nullable: true })
  imageUrl?: string;

  @Field({ nullable: true })
  coverImageUrl?: string;

  @Field()
  isActive: boolean;

  @Field()
  rating: number;

  @Field(() => RestaurantType)
  type: RestaurantType;

  @Field()
  isFeatured: boolean;

  @Field(() => Int)
  sortOrder: number;

  @Field()
  deliveryFee: number;

  @Field()
  estimatedDeliveryTime: number;

  @Field({ nullable: true })
  latitude?: number;

  @Field({ nullable: true })
  longitude?: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
