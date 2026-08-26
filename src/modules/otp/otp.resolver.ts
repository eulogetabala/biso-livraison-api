import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { OtpService } from './otp.service';
import { RequestOtpInput } from './dto/request-otp.input';
import { VerifyOtpInput } from './dto/verify-otp.input';
import { OtpRequestResult } from './models/otp-request-result.model';

@Resolver()
export class OtpResolver {
  constructor(private readonly otpService: OtpService) {}

  @Mutation(() => OtpRequestResult)
  requestOtp(@Args('input') input: RequestOtpInput) {
    return this.otpService.requestOtp(input);
  }

  @Mutation(() => Boolean)
  verifyOtp(@Args('input') input: VerifyOtpInput) {
    return this.otpService.verifyOtp(input);
  }
}
