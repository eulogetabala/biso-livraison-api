import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { CmsService } from './cms.service';
import { HomeBannerModel } from './models/home-banner.model';
import { MarketCategoryModel } from './models/market-category.model';
import { CuisineTypeConfigModel } from './models/cuisine-type-config.model';
import { RestaurantModel } from '../restaurants/models/restaurant.model';
import {
  UpsertCuisineTypeInput,
  UpsertHomeBannerInput,
  UpsertMarketCategoryInput,
} from './dto/cms.inputs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Resolver()
export class CmsResolver {
  constructor(private readonly cmsService: CmsService) {}

  @Query(() => [HomeBannerModel])
  activeHomeBanners() {
    return this.cmsService.activeHomeBanners();
  }

  @Query(() => [MarketCategoryModel])
  activeMarketCategories() {
    return this.cmsService.activeMarketCategories();
  }

  @Query(() => [CuisineTypeConfigModel])
  activeCuisineTypes() {
    return this.cmsService.activeCuisineTypes();
  }

  @Query(() => RestaurantModel, { nullable: true })
  marketRestaurant() {
    return this.cmsService.marketRestaurant();
  }

  @Query(() => [HomeBannerModel])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  allHomeBanners() {
    return this.cmsService.allHomeBanners();
  }

  @Query(() => [MarketCategoryModel])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  allMarketCategories() {
    return this.cmsService.allMarketCategories();
  }

  @Query(() => [CuisineTypeConfigModel])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  allCuisineTypes() {
    return this.cmsService.allCuisineTypes();
  }

  @Mutation(() => HomeBannerModel)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  upsertHomeBanner(@Args('input') input: UpsertHomeBannerInput) {
    return this.cmsService.upsertHomeBanner(input);
  }

  @Mutation(() => MarketCategoryModel)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  upsertMarketCategory(@Args('input') input: UpsertMarketCategoryInput) {
    return this.cmsService.upsertMarketCategory(input);
  }

  @Mutation(() => CuisineTypeConfigModel)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  upsertCuisineType(@Args('input') input: UpsertCuisineTypeInput) {
    return this.cmsService.upsertCuisineType(input);
  }

  @Mutation(() => HomeBannerModel)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  deleteHomeBanner(@Args('id', { type: () => ID }) id: string) {
    return this.cmsService.deleteHomeBanner(id);
  }

  @Mutation(() => MarketCategoryModel)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  deleteMarketCategory(@Args('id', { type: () => ID }) id: string) {
    return this.cmsService.deleteMarketCategory(id);
  }

  @Mutation(() => CuisineTypeConfigModel)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.PARTNER)
  deleteCuisineType(@Args('id', { type: () => ID }) id: string) {
    return this.cmsService.deleteCuisineType(id);
  }
}
