import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { ParcelsService } from './parcels.service';
import { ParcelModel } from './models/parcel.model';
import { CreateParcelInput } from './dto/create-parcel.input';
import { UpdateParcelStatusInput } from './dto/update-parcel-status.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => ParcelModel)
export class ParcelsResolver {
  constructor(private readonly parcelsService: ParcelsService) {}

  @Query(() => [ParcelModel])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  parcels() {
    return this.parcelsService.findAll();
  }

  @Query(() => [ParcelModel])
  @UseGuards(JwtAuthGuard)
  myParcels(@CurrentUser() user: CurrentUser) {
    return this.parcelsService.myParcels(user.id);
  }

  @Query(() => ParcelModel)
  @UseGuards(JwtAuthGuard)
  parcel(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: CurrentUser,
  ) {
    return this.parcelsService.findOne(id, user);
  }

  @Mutation(() => ParcelModel)
  @UseGuards(JwtAuthGuard)
  createParcel(
    @Args('input') input: CreateParcelInput,
    @CurrentUser() user: CurrentUser,
  ) {
    return this.parcelsService.create(input, user.id);
  }

  @Mutation(() => ParcelModel)
  @UseGuards(JwtAuthGuard)
  updateParcelStatus(
    @Args('input') input: UpdateParcelStatusInput,
    @CurrentUser() user: CurrentUser,
  ) {
    return this.parcelsService.updateStatus(input.id, input.status, user);
  }

  @Mutation(() => ParcelModel)
  @UseGuards(JwtAuthGuard)
  deleteParcel(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: CurrentUser,
  ) {
    return this.parcelsService.remove(id, user);
  }
}
