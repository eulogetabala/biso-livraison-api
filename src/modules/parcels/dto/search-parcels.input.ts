import { Field, InputType } from '@nestjs/graphql';
import { ParcelStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

@InputType()
export class SearchParcelsInput {
  @Field(() => ParcelStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ParcelStatus)
  status?: ParcelStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  from?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  to?: string;
}
