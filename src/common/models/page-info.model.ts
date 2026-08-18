import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PageInfo {
  @Field(() => Int)
  totalItems: number;

  @Field(() => Int)
  totalPages: number;

  @Field(() => Int)
  currentPage: number;

  @Field(() => Int)
  limit: number;

  @Field()
  hasNextPage: boolean;

  @Field()
  hasPreviousPage: boolean;
}
