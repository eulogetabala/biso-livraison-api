import { Field, ID, InputType, Int } from '@nestjs/graphql';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

@InputType()
export class CreateReviewInput {
  @Field(() => ID)
  @IsUUID()
  orderId: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  restaurantId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  driverId?: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  rating: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
