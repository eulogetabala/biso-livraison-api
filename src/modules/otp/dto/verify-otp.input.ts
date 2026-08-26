import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

@InputType()
export class VerifyOtpInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9\s.-]{6,20}$/, {
    message: 'phone must be a valid phone number',
  })
  phone: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4,8}$/, {
    message: 'code must contain only digits',
  })
  code: string;
}
