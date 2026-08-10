import { Field, Float, InputType } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

@InputType()
export class CreateParcelInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  receiverName: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9\s.-]{6,20}$/, {
    message: 'receiverPhone must be a valid phone number',
  })
  receiverPhone: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  receiverAddress: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;
}
