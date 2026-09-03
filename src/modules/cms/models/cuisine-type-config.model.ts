import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CuisineTypeConfigModel {
  @Field(() => ID)
  id: string;

  @Field()
  value: string;

  @Field()
  label: string;

  @Field({ nullable: true })
  emoji?: string;

  @Field()
  sortOrder: number;

  @Field()
  isActive: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
