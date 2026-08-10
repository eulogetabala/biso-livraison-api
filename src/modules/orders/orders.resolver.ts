import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { OrdersService } from './orders.service';
import { OrderModel } from './models/order.model';
import { CreateOrderInput } from './dto/create-order.input';
import { UpdateOrderStatusInput } from './dto/update-order-status.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => OrderModel)
export class OrdersResolver {
  constructor(private readonly ordersService: OrdersService) {}

  @Query(() => [OrderModel])
  @UseGuards(JwtAuthGuard)
  myOrders(@CurrentUser() user: CurrentUser) {
    return this.ordersService.findByUser(user.id);
  }

  @Query(() => [OrderModel])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  orders() {
    return this.ordersService.findAll();
  }

  @Query(() => OrderModel)
  @UseGuards(JwtAuthGuard)
  order(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: CurrentUser,
  ) {
    return this.ordersService.findOne(id, user);
  }

  @Mutation(() => OrderModel)
  @UseGuards(JwtAuthGuard)
  createOrder(
    @Args('input') input: CreateOrderInput,
    @CurrentUser() user: CurrentUser,
  ) {
    return this.ordersService.create(input, user.id);
  }

  @Mutation(() => OrderModel)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER, UserRole.DRIVER)
  updateOrderStatus(@Args('input') input: UpdateOrderStatusInput) {
    return this.ordersService.updateStatus(input.id, input.status);
  }

  @Mutation(() => OrderModel)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  deleteOrder(@Args('id', { type: () => ID }) id: string) {
    return this.ordersService.remove(id);
  }
}
