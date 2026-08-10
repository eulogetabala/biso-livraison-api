import { Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { OrderStatus } from '@prisma/client';
import { UserModel } from '../../users/models/user.model';
import { RestaurantModel } from '../../restaurants/models/restaurant.model';
import { MenuItemModel } from '../../menus/models/menu-item.model';
import { PaymentModel } from '../../payments/models/payment.model';

registerEnumType(OrderStatus, {
  name: 'OrderStatus',
  description: 'Current status of an order',
});

@ObjectType()
export class OrderItemModel {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  orderId: string;

  @Field(() => ID)
  menuItemId: string;

  @Field(() => Int)
  quantity: number;

  @Field()
  unitPrice: number;

  @Field(() => MenuItemModel, { nullable: true })
  menuItem?: MenuItemModel;
}

@ObjectType()
export class OrderModel {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => ID)
  restaurantId: string;

  @Field(() => OrderStatus)
  status: OrderStatus;

  @Field()
  total: number;

  @Field(() => [OrderItemModel])
  items: OrderItemModel[];

  @Field(() => UserModel, { nullable: true })
  user?: UserModel;

  @Field(() => RestaurantModel, { nullable: true })
  restaurant?: RestaurantModel;

  @Field(() => PaymentModel, { nullable: true })
  payment?: PaymentModel;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
