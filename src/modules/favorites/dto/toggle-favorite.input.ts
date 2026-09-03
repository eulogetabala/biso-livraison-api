import { Field, Float, ID, InputType } from '@nestjs/graphql';
import { FavoriteKind } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

@InputType()
export class ToggleFavoriteInput {
  @Field(() => ID)
  @IsUUID()
  targetId: string;

  @Field(() => FavoriteKind)
  @IsEnum(FavoriteKind)
  kind: FavoriteKind;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  price?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  seller?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  cuisineType?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  rating?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;
}
