import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CatalogStatsModel {
  @Field(() => Int)
  restaurants: number;

  @Field(() => Int)
  menuDishes: number;

  @Field(() => Int)
  simpleProducts: number;

  @Field(() => Int)
  supplements: number;
}
