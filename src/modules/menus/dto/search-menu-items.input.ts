import { Field, ID, InputType } from '@nestjs/graphql';
import { MenuItemCategory } from '@prisma/client';
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
}
