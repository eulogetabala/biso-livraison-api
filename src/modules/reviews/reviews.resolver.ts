import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { ReviewsService } from './reviews.service';
import { ReviewModel } from './models/review.model';
import { PaginatedReviewModel } from './models/paginated-review.model';
import { CreateReviewInput } from './dto/create-review.input';
import { UpdateReviewInput } from './dto/update-review.input';
import { PaginationArgs } from '../../common/dto/pagination.args';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => ReviewModel)
export class ReviewsResolver {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Query(() => PaginatedReviewModel)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  reviews(@Args() pagination: PaginationArgs) {
    return this.reviewsService.findAll(pagination);
  }

  @Query(() => PaginatedReviewModel)
  @UseGuards(JwtAuthGuard)
  myReviews(
    @Args() pagination: PaginationArgs,
    @CurrentUser() user: CurrentUser,
  ) {
    return this.reviewsService.myReviews(user.id, pagination);
  }

  @Query(() => PaginatedReviewModel)
  reviewsByRestaurant(
    @Args('restaurantId', { type: () => ID }) restaurantId: string,
    @Args() pagination: PaginationArgs,
  ) {
    return this.reviewsService.findByRestaurant(restaurantId, pagination);
  }

  @Query(() => PaginatedReviewModel)
  reviewsByDriver(
    @Args('driverId', { type: () => ID }) driverId: string,
    @Args() pagination: PaginationArgs,
  ) {
    return this.reviewsService.findByDriver(driverId, pagination);
  }

  @Query(() => ReviewModel)
  review(@Args('id', { type: () => ID }) id: string) {
    return this.reviewsService.findOne(id);
  }

  @Mutation(() => ReviewModel)
  @UseGuards(JwtAuthGuard)
  createReview(
    @Args('input') input: CreateReviewInput,
    @CurrentUser() user: CurrentUser,
  ) {
    return this.reviewsService.create(input, user.id);
  }

  @Mutation(() => ReviewModel)
  @UseGuards(JwtAuthGuard)
  updateReview(
    @Args('input') input: UpdateReviewInput,
    @CurrentUser() user: CurrentUser,
  ) {
    const { id, ...data } = input;
    return this.reviewsService.update(id, data, user);
  }

  @Mutation(() => ReviewModel)
  @UseGuards(JwtAuthGuard)
  deleteReview(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: CurrentUser,
  ) {
    return this.reviewsService.remove(id, user);
  }
}
