import { Field, ID, InputType } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

@InputType()
export class AdminCreatePartnerInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @Field()
  @IsString()
  @Matches(/^\+?[0-9\s.-]{6,20}$/, {
    message: 'phone must be a valid phone number',
  })
  phone: string;

  @Field()
  @IsString()
  @MinLength(6)
  @MaxLength(72)
  password: string;

  @Field(() => ID)
  @IsUUID()
  partnerRestaurantId: string;
}
