import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { BannerLinkType } from '@prisma/client';

registerEnumType(BannerLinkType, {
  name: 'BannerLinkType',
  description: 'Destination when user taps a home banner CTA',
});

@ObjectType()
export class HomeBannerModel {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  subtitle?: string;

  @Field()
  imageUrl: string;

  @Field({ nullable: true })
  ctaLabel?: string;

  @Field(() => BannerLinkType)
  linkType: BannerLinkType;

  @Field({ nullable: true })
  linkValue?: string;

  @Field()
  sortOrder: number;

  @Field()
  isActive: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
