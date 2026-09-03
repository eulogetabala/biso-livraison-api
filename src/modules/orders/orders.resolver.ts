import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { OrdersService } from './orders.service';
import { OrderModel } from './models/order.model';
import { PaginatedOrderModel } from './models/paginated-order.model';
import { CreateOrderInput } from './dto/create-order.input';
import { UpdateOrderStatusInput } from './dto/update-order-status.input';
import { SearchOrdersInput } from './dto/search-orders.input';
import { PaginationArgs } from '../../common/dto/pagination.args';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => OrderModel)
export class OrdersResolver {
  constructor(private readonly ordersService: OrdersService) {}

  @Query(() => PaginatedOrderModel)
  @UseGuards(JwtAuthGuard)
  myOrders(
    @Args() pagination: PaginationArgs,
    @CurrentUser() user: CurrentUser,
  ) {
    return this.ordersService.findByUser(user.id, pagination);
  }

  @Query(() => PaginatedOrderModel)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  orders(
    @Args() pagination: PaginationArgs,
    @CurrentUser() user: CurrentUser,
    @Args('input', { nullable: true }) input?: SearchOrdersInput,
  ) {
    return this.ordersService.findAll(pagination, input, user);
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
  updateOrderStatus(
    @Args('input') input: UpdateOrderStatusInput,
    @CurrentUser() user: CurrentUser,
  ) {
    return this.ordersService.updateStatus(input.id, input.status, user);
  }

  @Mutation(() => OrderModel)
  @UseGuards(JwtAuthGuard)
  cancelOrder(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: CurrentUser,
  ) {
    return this.ordersService.cancelByClient(id, user);
  }

  @Mutation(() => OrderModel)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  deleteOrder(@Args('id', { type: () => ID }) id: string) {
    return this.ordersService.remove(id);
  }
}
