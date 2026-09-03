import { UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { THROTTLE_REGISTER } from '../../common/constants/throttle.constants';
import { UsersService } from './users.service';
import { UserModel } from './models/user.model';
import { PaginatedUserModel } from './models/paginated-user.model';
import {
  DailyUserRegistrationsModel,
  UserStatisticsOverviewModel,
  UserStatisticsRangeInput,
} from './models/user-statistics.models';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateProfileInput } from './dto/update-profile.input';
import { SearchUsersInput } from './dto/search-users.input';
import { AdminSetUserBlockedInput } from './dto/admin-set-user-blocked.input';
import { PaginationArgs } from '../../common/dto/pagination.args';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '../auth/decorators/current-user.decorator';

@Resolver(() => UserModel)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => [UserModel])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  users() {
    return this.usersService.findAll();
  }

  @Query(() => PaginatedUserModel)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  usersPaginated(
    @Args() pagination: PaginationArgs,
    @Args('input', { nullable: true }) input?: SearchUsersInput,
  ) {
    return this.usersService.search(pagination, input);
  }

  @Query(() => UserStatisticsOverviewModel)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  userStatisticsOverview(
    @Args('range', { nullable: true }) range?: UserStatisticsRangeInput,
  ) {
    return this.usersService.statisticsOverview(range ?? {});
  }

  @Query(() => [DailyUserRegistrationsModel])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  dailyUserRegistrations(
    @Args('range', { nullable: true }) range?: UserStatisticsRangeInput,
  ) {
    return this.usersService.dailyRegistrations(range ?? {});
  }

  @Query(() => UserModel)
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: CurrentUserType) {
    return this.usersService.findById(user.id);
  }

  @Mutation(() => UserModel)
  @UseGuards(JwtAuthGuard)
  updateProfile(
    @Args('input') input: UpdateProfileInput,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.usersService.updateProfile(user.id, input);
  }

  @Mutation(() => UserModel)
  @UseGuards(JwtAuthGuard)
  deleteMyAccount(@CurrentUser() user: CurrentUserType) {
    return this.usersService.deleteAccount(user.id);
  }

  @Mutation(() => UserModel)
  @UseGuards(JwtAuthGuard)
  registerPushToken(
    @Args('token') token: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.usersService.registerPushToken(user.id, token);
  }

  @Mutation(() => UserModel)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  adminSetUserBlocked(@Args('input') input: AdminSetUserBlockedInput) {
    return this.usersService.adminSetBlocked(input.userId, input.isBlocked);
  }

  @Mutation(() => UserModel)
  @Throttle(THROTTLE_REGISTER)
  createUser(@Args('input') input: CreateUserInput) {
    return this.usersService.create(input);
  }
}
