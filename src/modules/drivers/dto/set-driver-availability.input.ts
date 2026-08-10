import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsNotEmpty } from 'class-validator';

@InputType()
export class SetDriverAvailabilityInput {
  @Field()
  @IsBoolean()
  @IsNotEmpty()
  isAvailable: boolean;
}
