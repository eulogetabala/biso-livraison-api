import { Field, ObjectType } from '@nestjs/graphql';
import { UserModel } from '../../users/models/user.model';

@ObjectType()
export class LoginResultModel {
  @Field()
  accessToken: string;

  @Field(() => UserModel)
  user: UserModel;
}
