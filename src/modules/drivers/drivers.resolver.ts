import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { DriversService } from './drivers.service';
import { DriverModel } from './models/driver.model';
import { UpdateDriverProfileInput } from './dto/update-driver-profile.input';
import { SetDriverAvailabilityInput } from './dto/set-driver-availability.input';
import { AdminCreateDriverInput } from './dto/admin-create-driver.input';
import { AdminUpdateDriverInput } from './dto/admin-update-driver.input';
import { AdminSetDriverAvailabilityInput } from './dto/admin-set-driver-availability.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => DriverModel)
export class DriversResolver {
  constructor(private readonly driversService: DriversService) {}

  @Query(() => [DriverModel])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  drivers() {
    return this.driversService.findAll();
  }

  @Query(() => [DriverModel])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER, UserRole.CLIENT)
  availableDrivers() {
    return this.driversService.findAvailable();
  }

  @Query(() => DriverModel)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER)
  myDriverProfile(@CurrentUser() user: CurrentUser) {
    return this.driversService.myProfile(user.id);
  }

  @Query(() => DriverModel)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CLIENT)
  driver(@Args('id', { type: () => ID }) id: string) {
    return this.driversService.findOne(id);
  }

  @Mutation(() => DriverModel)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER)
  updateDriverProfile(
    @Args('input') input: UpdateDriverProfileInput,
    @CurrentUser() user: CurrentUser,
  ) {
    return this.driversService.updateProfile(user.id, input);
  }

  @Mutation(() => DriverModel)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER)
  setDriverAvailability(
    @Args('input') input: SetDriverAvailabilityInput,
    @CurrentUser() user: CurrentUser,
  ) {
    return this.driversService.setAvailability(user, input.isAvailable);
  }

  @Mutation(() => DriverModel)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  createDriverProfile(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('vehicleType', { nullable: true }) vehicleType?: string,
    @Args('vehiclePlate', { nullable: true }) vehiclePlate?: string,
  ) {
    return this.driversService.createProfileForUser(
      userId,
      vehicleType,
      vehiclePlate,
    );
  }

  @Mutation(() => DriverModel)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  adminCreateDriver(@Args('input') input: AdminCreateDriverInput) {
    return this.driversService.adminCreateDriver(input);
  }

  @Mutation(() => DriverModel)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  adminSetDriverAvailability(
    @Args('input') input: AdminSetDriverAvailabilityInput,
  ) {
    return this.driversService.adminSetAvailability(
      input.driverId,
      input.isAvailable,
    );
  }

  @Mutation(() => DriverModel)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  adminUpdateDriver(@Args('input') input: AdminUpdateDriverInput) {
    return this.driversService.adminUpdateDriver(input);
  }
}
