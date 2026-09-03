import { ForbiddenException, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { THROTTLE_GPS } from '../../common/constants/throttle.constants';
import { GeoService } from './geo.service';
import { DriverLocationModel } from './models/driver-location.model';
import { ActiveDeliveryTrackingModel } from './models/active-delivery-tracking.model';
import { UpdateDriverLocationInput } from './dto/update-driver-location.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => DriverLocationModel)
export class GeoResolver {
  constructor(private readonly geoService: GeoService) {}

  @Mutation(() => DriverLocationModel)
  @UseGuards(JwtAuthGuard)
  @Throttle(THROTTLE_GPS)
  updateDriverLocation(
    @Args('input') input: UpdateDriverLocationInput,
    @CurrentUser() user: CurrentUser,
  ) {
    if (user.role !== UserRole.DRIVER) {
      throw new ForbiddenException(
        'Only a user with the DRIVER role can update their location',
      );
    }
    return this.geoService.upsertLocation(user.id, input);
  }

  @Query(() => DriverLocationModel)
  @UseGuards(JwtAuthGuard)
  myLocation(@CurrentUser() user: CurrentUser) {
    return this.geoService.getLocation(user.id);
  }

  @Query(() => DriverLocationModel)
  @UseGuards(JwtAuthGuard)
  trackDelivery(
    @Args('orderId', { type: () => ID }) orderId: string,
    @CurrentUser() user: CurrentUser,
  ) {
    return this.geoService.trackDelivery(orderId, user);
  }

  @Query(() => DriverLocationModel)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  driverLocation(@Args('driverId', { type: () => ID }) driverId: string) {
    return this.geoService.getLocation(driverId);
  }

  @Query(() => [DriverLocationModel])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  driverLocations() {
    return this.geoService.getAllLocations();
  }

  @Query(() => [ActiveDeliveryTrackingModel])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  activeDeliveriesTracking() {
    return this.geoService.getActiveDeliveriesTracking();
  }
}
