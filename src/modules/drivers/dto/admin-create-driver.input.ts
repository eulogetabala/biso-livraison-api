import { Field, InputType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

@InputType()
export class AdminCreateDriverInput {
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

  @Field({ nullable: true, defaultValue: 'MOTO' })
  @IsOptional()
  @IsString()
  vehicleType?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  vehiclePlate?: string;

  @Field({ nullable: true, defaultValue: false })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
