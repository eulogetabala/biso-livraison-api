import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { RestaurantsService } from './restaurants.service';
import { RestaurantModel } from './models/restaurant.model';
import { PaginatedRestaurantModel } from './models/paginated-restaurant.model';
import { CreateRestaurantInput } from './dto/create-restaurant.input';
import { UpdateRestaurantInput } from './dto/update-restaurant.input';
import { SearchRestaurantsInput } from './dto/search-restaurants.input';
import { PaginationArgs } from '../../common/dto/pagination.args';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Resolver(() => RestaurantModel)
export class RestaurantsResolver {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Query(() => PaginatedRestaurantModel)
  searchRestaurants(
    @Args() pagination: PaginationArgs,
    @Args('input', { nullable: true }) input?: SearchRestaurantsInput,
  ) {
    return this.restaurantsService.search(input, pagination);
  }

  @Query(() => PaginatedRestaurantModel)
  restaurants(@Args() pagination: PaginationArgs) {
    return this.restaurantsService.findAll(pagination);
  }

  @Query(() => RestaurantModel)
  restaurant(@Args('id', { type: () => ID }) id: string) {
    return this.restaurantsService.findOne(id);
  }

  @Mutation(() => RestaurantModel)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  createRestaurant(@Args('input') input: CreateRestaurantInput) {
    return this.restaurantsService.create(input);
  }

  @Mutation(() => RestaurantModel)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  updateRestaurant(@Args('input') input: UpdateRestaurantInput) {
    const { id, ...data } = input;
    return this.restaurantsService.update(id, data);
  }

  @Mutation(() => RestaurantModel)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  deleteRestaurant(@Args('id', { type: () => ID }) id: string) {
    return this.restaurantsService.remove(id);
  }
}
