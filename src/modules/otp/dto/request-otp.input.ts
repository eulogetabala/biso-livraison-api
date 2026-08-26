import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

@InputType()
export class RequestOtpInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9\s.-]{6,20}$/, {
    message: 'phone must be a valid phone number',
  })
  phone: string;
}
