import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { MenuItemCategory } from '@prisma/client';
import { RestaurantModel } from '../../restaurants/models/restaurant.model';

registerEnumType(MenuItemCategory, {
  name: 'MenuItemCategory',
  description: 'Category of a menu item',
});

@ObjectType()
export class MenuItemModel {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  restaurantId: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  price: number;

  @Field(() => MenuItemCategory)
  category: MenuItemCategory;

  @Field({ nullable: true })
  imageUrl?: string;

  @Field()
  isAvailable: boolean;

  @Field(() => RestaurantModel, { nullable: true })
  restaurant?: RestaurantModel;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
