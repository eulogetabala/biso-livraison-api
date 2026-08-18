import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { DeliveriesService } from './deliveries.service';
import { DeliveryModel } from './models/delivery.model';
import { PaginatedDeliveryModel } from './models/paginated-delivery.model';
import { AssignDriverInput } from './dto/assign-driver.input';
import { UpdateDeliveryStatusInput } from './dto/update-delivery-status.input';
import { PaginationArgs } from '../../common/dto/pagination.args';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => DeliveryModel)
export class DeliveriesResolver {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Query(() => PaginatedDeliveryModel)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER)
  myDeliveries(
    @Args() pagination: PaginationArgs,
    @CurrentUser() user: CurrentUser,
  ) {
    return this.deliveriesService.myDeliveries(user.id, pagination);
  }

  @Query(() => PaginatedDeliveryModel)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  deliveries(@Args() pagination: PaginationArgs) {
    return this.deliveriesService.findAll(pagination);
  }

  @Query(() => DeliveryModel)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  deliveryByOrder(@Args('orderId', { type: () => ID }) orderId: string) {
    return this.deliveriesService.findByOrder(orderId);
  }

  @Mutation(() => DeliveryModel)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  assignDriver(@Args('input') input: AssignDriverInput) {
    return this.deliveriesService.assign(input.orderId, input.driverId);
  }

  @Mutation(() => DeliveryModel)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  assignAvailableDriver(@Args('orderId', { type: () => ID }) orderId: string) {
    return this.deliveriesService.assignAvailableDriver(orderId);
  }

  @Mutation(() => DeliveryModel)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER, UserRole.ADMIN)
  updateDeliveryStatus(
    @Args('input') input: UpdateDeliveryStatusInput,
    @CurrentUser() user: CurrentUser,
  ) {
    return this.deliveriesService.updateStatus(input.id, input.status, user);
  }

  @Mutation(() => DeliveryModel)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  deleteDelivery(@Args('id', { type: () => ID }) id: string) {
    return this.deliveriesService.remove(id);
  }
}
