import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class OtpRequestResult {
  @Field()
  phone: string;

  @Field()
  expiresIn: number;

  /**
   * Code renvoyé en développement uniquement, pour permettre de tester le flux
   * sans recevoir réellement le SMS. Toujours null en production.
   */
  @Field(() => String, { nullable: true })
  devCode: string | null;
}
