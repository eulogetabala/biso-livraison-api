import { Field, ID, InputType } from '@nestjs/graphql';
import { ParcelStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';

@InputType()
export class UpdateParcelStatusInput {
  @Field(() => ID)
  @IsUUID()
  id: string;

  @Field(() => ParcelStatus)
  @IsEnum(ParcelStatus)
  @IsNotEmpty()
  status: ParcelStatus;
}
