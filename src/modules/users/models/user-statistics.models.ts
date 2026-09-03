import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsDateString, IsOptional } from 'class-validator';

@InputType()
export class UserStatisticsRangeInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  from?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  to?: string;
}

@ObjectType()
export class UserStatisticsOverviewModel {
  @Field(() => Int)
  totalClients: number;

  @Field(() => Int)
  newRegistrations: number;

  @Field(() => Int)
  verifiedRegistrations: number;

  @Field(() => Int)
  pendingOtp: number;

  @Field(() => Int)
  blockedClients: number;
}

@ObjectType()
export class DailyUserRegistrationsModel {
  @Field()
  date: string;

  @Field(() => Int)
  count: number;
}
