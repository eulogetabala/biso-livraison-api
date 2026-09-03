import { Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { MenuItemCategory, MenuItemKind } from '@prisma/client';
import { RestaurantModel } from '../../restaurants/models/restaurant.model';
import { MarketCategoryModel } from '../../cms/models/market-category.model';
import { MenuItemSupplementModel } from './menu-item-supplement.model';

registerEnumType(MenuItemCategory, {
  name: 'MenuItemCategory',
  description: 'Category of a menu item',
});

registerEnumType(MenuItemKind, {
  name: 'MenuItemKind',
  description: 'Restaurant dish or standalone simple product',
});

@ObjectType()
export class MenuItemModel {
  @Field(() => ID)
  id: string;

  @Field(() => ID, { nullable: true })
  restaurantId?: string;

  @Field(() => MenuItemKind)
  kind: MenuItemKind;

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

  @Field({ nullable: true })
  seller?: string;

  @Field({ nullable: true })
  badge?: string;

  @Field()
  isFeatured: boolean;

  @Field(() => Int)
  sortOrder: number;

  @Field(() => ID, { nullable: true })
  marketCategoryId?: string;

  @Field(() => MarketCategoryModel, { nullable: true })
  marketCategory?: MarketCategoryModel;

  @Field(() => RestaurantModel, { nullable: true })
  restaurant?: RestaurantModel;

  @Field(() => [MenuItemSupplementModel])
  supplements: MenuItemSupplementModel[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
