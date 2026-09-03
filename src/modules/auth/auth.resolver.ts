import { Throttle } from '@nestjs/throttler';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { THROTTLE_AUTH } from '../../common/constants/throttle.constants';
import { AuthService } from './auth.service';
import { LoginInput } from './dto/login.input';
import { LoginResultModel } from './models/login-result.model';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => LoginResultModel)
  @Throttle(THROTTLE_AUTH)
  login(@Args('input') input: LoginInput) {
    return this.authService.login(input);
  }
}
