import { Field, ID, InputType } from '@nestjs/graphql';
import { MenuItemCategory, MenuItemKind } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

@InputType()
export class SearchMenuItemsInput {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  restaurantId?: string;

  @Field(() => MenuItemKind, { nullable: true })
  @IsOptional()
  @IsEnum(MenuItemKind)
  kind?: MenuItemKind;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  simpleProductsOnly?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  restaurantDishesOnly?: boolean;

  @Field(() => MenuItemCategory, { nullable: true })
  @IsOptional()
  @IsEnum(MenuItemCategory)
  category?: MenuItemCategory;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  query?: string;

  @Field({ nullable: true, defaultValue: true })
  @IsOptional()
  @IsBoolean()
  onlyAvailable?: boolean;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  marketCategoryId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  featuredOnly?: boolean;
}
