import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { TrackingService } from './tracking.service';
import { TrackingEventModel } from './models/tracking-event.model';
import { AddTrackingEventInput } from './dto/add-tracking-event.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => TrackingEventModel)
export class TrackingResolver {
  constructor(private readonly trackingService: TrackingService) {}

  @Query(() => [TrackingEventModel])
  @UseGuards(JwtAuthGuard)
  trackingByDelivery(
    @Args('deliveryId', { type: () => ID }) deliveryId: string,
    @CurrentUser() user: CurrentUser,
  ) {
    return this.trackingService.getByDelivery(deliveryId, user);
  }

  @Mutation(() => TrackingEventModel)
  @UseGuards(JwtAuthGuard)
  addTrackingEvent(
    @Args('input') input: AddTrackingEventInput,
    @CurrentUser() user: CurrentUser,
  ) {
    return this.trackingService.addEvent(input, user);
  }
}
