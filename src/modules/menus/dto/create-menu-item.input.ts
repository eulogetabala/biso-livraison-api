import { Field, ID, InputType } from '@nestjs/graphql';
import { MenuItemCategory } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

@InputType()
export class CreateMenuItemInput {
  @Field(() => ID)
  @IsUUID()
  restaurantId: string;

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
  @IsBoolean()
  isAvailable?: boolean;
}
