import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { UserModel } from '../../users/models/user.model';
import { RestaurantModel } from '../../restaurants/models/restaurant.model';
import { OrderModel } from '../../orders/models/order.model';

@ObjectType()
export class ReviewModel {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  orderId: string;

  @Field(() => ID)
  userId: string;

  @Field(() => ID, { nullable: true })
  restaurantId?: string;

  @Field(() => ID, { nullable: true })
  driverId?: string;

  @Field(() => Int)
  rating: number;

  @Field({ nullable: true })
  comment?: string;

  @Field(() => OrderModel, { nullable: true })
  order?: OrderModel;

  @Field(() => UserModel, { nullable: true })
  author?: UserModel;

  @Field(() => RestaurantModel, { nullable: true })
  restaurant?: RestaurantModel;

  @Field(() => UserModel, { nullable: true })
  driver?: UserModel;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
