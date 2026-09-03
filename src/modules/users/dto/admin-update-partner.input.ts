import { Field, ID, InputType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

@InputType()
export class AdminUpdatePartnerInput {
  @Field(() => ID)
  @IsUUID()
  userId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  firstName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  lastName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9\s.-]{6,20}$/, {
    message: 'phone must be a valid phone number',
  })
  phone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(72)
  password?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  partnerRestaurantId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;
}
