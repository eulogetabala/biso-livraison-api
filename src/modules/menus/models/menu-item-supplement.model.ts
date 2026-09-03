import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MenuItemSupplementModel {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  menuItemId: string;

  @Field()
  name: string;

  @Field(() => Float)
  price: number;

  @Field()
  isAvailable: boolean;

  @Field(() => Int)
  sortOrder: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
