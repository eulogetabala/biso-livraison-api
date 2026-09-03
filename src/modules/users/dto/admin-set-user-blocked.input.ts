import { Field, ID, InputType } from '@nestjs/graphql';
import { IsBoolean, IsUUID } from 'class-validator';

@InputType()
export class AdminSetUserBlockedInput {
  @Field(() => ID)
  @IsUUID()
  userId: string;

  @Field()
  @IsBoolean()
  isBlocked: boolean;
}
