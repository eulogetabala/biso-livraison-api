import { Field, ID, InputType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@InputType()
export class AssignDriverToParcelInput {
  @Field(() => ID)
  @IsUUID()
  parcelId: string;

  @Field(() => ID)
  @IsUUID()
  driverId: string;
}
