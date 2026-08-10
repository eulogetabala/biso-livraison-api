import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { PaymentModel } from './models/payment.model';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => PaymentModel)
export class PaymentsResolver {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Query(() => [PaymentModel])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  payments() {
    return this.paymentsService.findAll();
  }

  @Query(() => PaymentModel)
  @UseGuards(JwtAuthGuard)
  paymentByOrder(
    @Args('orderId', { type: () => ID }) orderId: string,
    @CurrentUser() user: CurrentUser,
  ) {
    return this.paymentsService.findByOrder(orderId, user);
  }

  @Mutation(() => PaymentModel)
  @UseGuards(JwtAuthGuard)
  collectCashOnDelivery(
    @Args('orderId', { type: () => ID }) orderId: string,
    @CurrentUser() user: CurrentUser,
  ) {
    return this.paymentsService.markPaid(orderId, user);
  }
}
