import { Field, Float, ID, InputType, Int } from '@nestjs/graphql';
import { BannerLinkType, RestaurantType } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

@InputType()
export class UpsertHomeBannerInput {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  id?: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  title: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  subtitle?: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  ctaLabel?: string;

  @Field(() => BannerLinkType, { nullable: true })
  @IsOptional()
  @IsEnum(BannerLinkType)
  linkType?: BannerLinkType;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  linkValue?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@InputType()
export class UpsertMarketCategoryInput {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  id?: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  label: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  subtitle?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  icon?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  iconLib?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  tint?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  iconColor?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@InputType()
export class UpsertCuisineTypeInput {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  id?: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  value: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  label: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  emoji?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
