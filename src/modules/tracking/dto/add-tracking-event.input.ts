import { Field, ID, InputType } from '@nestjs/graphql';
import { DeliveryStatus } from '@prisma/client';
import {
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

@InputType()
export class AddTrackingEventInput {
  @Field(() => ID)
  @IsUUID()
  deliveryId: string;

  @Field(() => DeliveryStatus)
  @IsEnum(DeliveryStatus)
  @IsNotEmpty()
  status: DeliveryStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  message?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsLongitude()
  longitude?: number;
}
