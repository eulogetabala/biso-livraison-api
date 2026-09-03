import { Field, ID, InputType } from '@nestjs/graphql';
import { IsBoolean, IsUUID } from 'class-validator';

@InputType()
export class AdminSetDriverAvailabilityInput {
  @Field(() => ID)
  @IsUUID()
  driverId: string;

  @Field()
  @IsBoolean()
  isAvailable: boolean;
}
