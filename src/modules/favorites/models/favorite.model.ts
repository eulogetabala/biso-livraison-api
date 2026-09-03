import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { FavoriteKind } from '@prisma/client';

registerEnumType(FavoriteKind, {
  name: 'FavoriteKind',
  description: 'Type of favorited item',
});

@ObjectType()
export class FavoriteModel {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  targetId: string;

  @Field(() => FavoriteKind)
  kind: FavoriteKind;

  @Field()
  name: string;

  @Field({ nullable: true })
  imageUrl?: string;

  @Field({ nullable: true })
  price?: number;

  @Field({ nullable: true })
  seller?: string;

  @Field({ nullable: true })
  cuisineType?: string;

  @Field({ nullable: true })
  rating?: number;

  @Field({ nullable: true })
  city?: string;

  @Field()
  createdAt: Date;
}
