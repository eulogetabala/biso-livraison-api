import { Field, ID, InputType } from '@nestjs/graphql';
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
export class AdminUpdateDriverInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  driverId: string;

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

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  vehicleType?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  vehiclePlate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
