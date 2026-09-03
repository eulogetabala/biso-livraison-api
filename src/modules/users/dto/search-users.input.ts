import { Field, InputType } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

@InputType()
export class SearchUsersInput {
  @Field(() => UserRole, { nullable: true })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  phoneVerified?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  from?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  to?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;
}
