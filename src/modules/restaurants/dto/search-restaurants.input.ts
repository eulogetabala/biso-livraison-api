import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { RestaurantType } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

@InputType()
export class SearchRestaurantsInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  query?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  city?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  cuisineType?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @Field({ nullable: true, defaultValue: true })
  @IsOptional()
  @IsBoolean()
  onlyActive?: boolean;

  @Field(() => RestaurantType, { nullable: true })
  @IsOptional()
  @IsEnum(RestaurantType)
  type?: RestaurantType;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  featuredOnly?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  excludeMarket?: boolean;
}
