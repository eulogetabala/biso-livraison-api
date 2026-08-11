import { Field, Float, ID, InputType } from '@nestjs/graphql';
import {
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsUUID,
} from 'class-validator';

@InputType()
export class UpdateDriverLocationInput {
  @Field(() => Float)
  @IsNumber()
  @IsLatitude({ message: 'latitude must be between -90 and 90' })
  latitude: number;

  @Field(() => Float)
  @IsNumber()
  @IsLongitude({ message: 'longitude must be between -180 and 180' })
  longitude: number;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  deliveryId?: string;
}
