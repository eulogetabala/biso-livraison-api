import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { MenusService } from './menus.service';
import { MenuItemModel } from './models/menu-item.model';
import { MenuItemSupplementModel } from './models/menu-item-supplement.model';
import { PaginatedMenuItemModel } from './models/paginated-menu-item.model';
import { CatalogStatsModel } from './models/catalog-stats.model';
import { CreateMenuItemInput } from './dto/create-menu-item.input';
import { UpdateMenuItemInput } from './dto/update-menu-item.input';
import { SearchMenuItemsInput } from './dto/search-menu-items.input';
import { UpsertMenuItemSupplementInput } from './dto/upsert-menu-item-supplement.input';
import { PaginationArgs } from '../../common/dto/pagination.args';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Resolver(() => MenuItemModel)
export class MenusResolver {
  constructor(private readonly menusService: MenusService) {}

  @Query(() => PaginatedMenuItemModel)
  searchMenuItems(
    @Args() pagination: PaginationArgs,
    @Args('input', { nullable: true }) input?: SearchMenuItemsInput,
  ) {
    return this.menusService.search(input, pagination);
  }

  @Query(() => PaginatedMenuItemModel)
  menuItems(@Args() pagination: PaginationArgs) {
    return this.menusService.findAll(pagination);
  }

  @Query(() => PaginatedMenuItemModel)
  menuItemsByRestaurant(
    @Args('restaurantId', { type: () => ID }) restaurantId: string,
    @Args() pagination: PaginationArgs,
  ) {
    return this.menusService.findByRestaurant(restaurantId, pagination);
  }

  @Query(() => MenuItemModel)
  menuItem(@Args('id', { type: () => ID }) id: string) {
    return this.menusService.findOne(id);
  }

  @Query(() => CatalogStatsModel)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  catalogStats() {
    return this.menusService.catalogStats();
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

  @Mutation(() => MenuItemSupplementModel)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  upsertMenuItemSupplement(@Args('input') input: UpsertMenuItemSupplementInput) {
    return this.menusService.upsertSupplement(input);
  }

  @Mutation(() => MenuItemSupplementModel)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  deleteMenuItemSupplement(@Args('id', { type: () => ID }) id: string) {
    return this.menusService.deleteSupplement(id);
  }
}
