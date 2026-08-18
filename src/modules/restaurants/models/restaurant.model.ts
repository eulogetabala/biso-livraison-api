import { Field, ID, ObjectType } from '@nestjs/graphql';

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

  @Field()
  deliveryFee: number;

  @Field()
  estimatedDeliveryTime: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
