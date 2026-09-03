import { Throttle } from '@nestjs/throttler';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { THROTTLE_OTP } from '../../common/constants/throttle.constants';
import { OtpService } from './otp.service';
import { RequestOtpInput } from './dto/request-otp.input';
import { ResetPasswordInput } from './dto/reset-password.input';
import { VerifyOtpInput } from './dto/verify-otp.input';
import { OtpRequestResult } from './models/otp-request-result.model';

@Resolver()
export class OtpResolver {
  constructor(private readonly otpService: OtpService) {}

  @Mutation(() => OtpRequestResult)
  @Throttle(THROTTLE_OTP)
  requestOtp(@Args('input') input: RequestOtpInput) {
    return this.otpService.requestOtp(input);
  }

  @Mutation(() => Boolean)
  @Throttle(THROTTLE_OTP)
  verifyOtp(@Args('input') input: VerifyOtpInput) {
    return this.otpService.verifyOtp(input);
  }

  @Mutation(() => Boolean)
  @Throttle(THROTTLE_OTP)
  resetPassword(@Args('input') input: ResetPasswordInput) {
    return this.otpService.resetPassword(input);
  }
}
