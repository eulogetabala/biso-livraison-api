import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MarketCategoryModel {
  @Field(() => ID)
  id: string;

  @Field()
  label: string;

  @Field({ nullable: true })
  subtitle?: string;

  @Field({ nullable: true })
  imageUrl?: string;

  @Field()
  icon: string;

  @Field()
  iconLib: string;

  @Field()
  tint: string;

  @Field()
  iconColor: string;

  @Field()
  sortOrder: number;

  @Field()
  isActive: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
