import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { MenuItemCategory, MenuItemKind } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
} from 'class-validator';

@InputType()
export class CreateMenuItemInput {
  @Field(() => MenuItemKind, { nullable: true, defaultValue: MenuItemKind.RESTAURANT_DISH })
  @IsOptional()
  @IsEnum(MenuItemKind)
  kind?: MenuItemKind;

  @Field(() => ID, { nullable: true })
  @ValidateIf((o: CreateMenuItemInput) => o.kind !== MenuItemKind.SIMPLE_PRODUCT)
  @IsUUID()
  restaurantId?: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field()
  @IsNumber()
  @Min(0)
  price: number;

  @Field(() => MenuItemCategory)
  @IsEnum(MenuItemCategory)
  category: MenuItemCategory;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  seller?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  badge?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  marketCategoryId?: string;
}
