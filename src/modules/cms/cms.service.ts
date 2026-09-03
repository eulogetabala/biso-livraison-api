import { Injectable, NotFoundException } from '@nestjs/common';
import { RestaurantType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  UpsertCuisineTypeInput,
  UpsertHomeBannerInput,
  UpsertMarketCategoryInput,
} from './dto/cms.inputs';

@Injectable()
export class CmsService {
  constructor(private readonly prisma: PrismaService) {}

  activeHomeBanners() {
    return this.prisma.homeBanner.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  activeMarketCategories() {
    return this.prisma.marketCategory.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    });
  }

  activeCuisineTypes() {
    return this.prisma.cuisineTypeConfig.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    });
  }

  marketRestaurant() {
    return this.prisma.restaurant.findFirst({
      where: { type: RestaurantType.MARKET, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  allHomeBanners() {
    return this.prisma.homeBanner.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  allMarketCategories() {
    return this.prisma.marketCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    });
  }

  allCuisineTypes() {
    return this.prisma.cuisineTypeConfig.findMany({
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    });
  }

  upsertHomeBanner(input: UpsertHomeBannerInput) {
    const { id, ...data } = input;
    if (id) {
      return this.prisma.homeBanner.update({ where: { id }, data });
    }
    return this.prisma.homeBanner.create({ data });
  }

  upsertMarketCategory(input: UpsertMarketCategoryInput) {
    const { id, ...data } = input;
    if (id) {
      return this.prisma.marketCategory.update({ where: { id }, data });
    }
    return this.prisma.marketCategory.create({ data });
  }

  upsertCuisineType(input: UpsertCuisineTypeInput) {
    const { id, ...data } = input;
    if (id) {
      return this.prisma.cuisineTypeConfig.update({ where: { id }, data });
    }
    return this.prisma.cuisineTypeConfig.create({ data });
  }

  async deleteHomeBanner(id: string) {
    try {
      return await this.prisma.homeBanner.delete({ where: { id } });
    } catch {
      throw new NotFoundException(`Banner ${id} not found`);
    }
  }

  async deleteMarketCategory(id: string) {
    try {
      return await this.prisma.marketCategory.delete({ where: { id } });
    } catch {
      throw new NotFoundException(`Market category ${id} not found`);
    }
  }

  async deleteCuisineType(id: string) {
    try {
      return await this.prisma.cuisineTypeConfig.delete({ where: { id } });
    } catch {
      throw new NotFoundException(`Cuisine type ${id} not found`);
    }
  }
}
