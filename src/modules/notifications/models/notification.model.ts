import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { NotificationType } from '@prisma/client';

registerEnumType(NotificationType, {
  name: 'NotificationType',
  description: 'Type of a notification',
});

@ObjectType()
export class NotificationModel {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => NotificationType)
  type: NotificationType;

  @Field()
  title: string;

  @Field()
  message: string;

  @Field({ nullable: true })
  readAt?: Date;

  @Field()
  createdAt: Date;
}
