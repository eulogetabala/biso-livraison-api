import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { MenusService } from './menus.service';
import { MenuItemModel } from './models/menu-item.model';
import { CreateMenuItemInput } from './dto/create-menu-item.input';
import { UpdateMenuItemInput } from './dto/update-menu-item.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Resolver(() => MenuItemModel)
export class MenusResolver {
  constructor(private readonly menusService: MenusService) {}

  @Query(() => [MenuItemModel])
  menuItems() {
    return this.menusService.findAll();
  }

  @Query(() => [MenuItemModel])
  menuItemsByRestaurant(
    @Args('restaurantId', { type: () => ID }) restaurantId: string,
  ) {
    return this.menusService.findByRestaurant(restaurantId);
  }

  @Query(() => MenuItemModel)
  menuItem(@Args('id', { type: () => ID }) id: string) {
    return this.menusService.findOne(id);
  }

  @Mutation(() => MenuItemModel)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  createMenuItem(@Args('input') input: CreateMenuItemInput) {
    return this.menusService.create(input);
  }

  @Mutation(() => MenuItemModel)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  updateMenuItem(@Args('input') input: UpdateMenuItemInput) {
    const { id, ...data } = input;
    return this.menusService.update(id, data);
  }

  @Mutation(() => MenuItemModel)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  deleteMenuItem(@Args('id', { type: () => ID }) id: string) {
    return this.menusService.remove(id);
  }
}
