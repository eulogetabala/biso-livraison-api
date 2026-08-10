import { Field, ID, InputType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@InputType()
export class AssignDriverInput {
  @Field(() => ID)
  @IsUUID()
  orderId: string;

  @Field(() => ID)
  @IsUUID()
  driverId: string;
}
