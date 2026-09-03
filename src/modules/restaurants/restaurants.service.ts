import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Restaurant, RestaurantType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  assertRestaurantAccess,
  isPartner,
  requirePartnerRestaurantId,
} from '../../common/utils/partner-scope.util';
import { CreateRestaurantInput } from './dto/create-restaurant.input';
import { UpdateRestaurantInput } from './dto/update-restaurant.input';
import { SearchRestaurantsInput } from './dto/search-restaurants.input';
import { PaginationArgs } from '../../common/dto/pagination.args';
import { paginate, PaginatedResult } from '../../common/utils/pagination.util';

@Injectable()
export class RestaurantsService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateRestaurantInput): Promise<Restaurant> {
    return this.prisma.restaurant.create({ data });
  }

  search(
    input: SearchRestaurantsInput = {},
    pagination: PaginationArgs,
  ): Promise<PaginatedResult<Restaurant>> {
    const where: Prisma.RestaurantWhereInput = {};

    if (input.onlyActive !== false) {
      where.isActive = true;
    }

    if (input.city) {
      where.city = { equals: input.city, mode: 'insensitive' };
    }

    if (input.cuisineType) {
      where.cuisineType = { contains: input.cuisineType, mode: 'insensitive' };
    }

    if (input.type) {
      where.type = input.type;
    }

    if (input.featuredOnly) {
      where.isFeatured = true;
    }

    if (input.excludeMarket) {
      where.type = { not: RestaurantType.MARKET };
    }

    if (input.minRating !== undefined) {
      where.rating = { gte: input.minRating };
    }

    if (input.query) {
      const q = { contains: input.query, mode: 'insensitive' as const };
      where.OR = [
        { name: q },
        { description: q },
        { cuisineType: q },
        { city: q },
      ];
    }

    return paginate(
      (args) =>
        this.prisma.restaurant.findMany({
          where,
          orderBy: [
            { isFeatured: 'desc' },
            { sortOrder: 'asc' },
            { rating: 'desc' },
            { name: 'asc' },
          ],
          skip: args.skip,
          take: args.take,
        }),
      () => this.prisma.restaurant.count({ where }),
      pagination,
    );
  }

  findAll(
    pagination: PaginationArgs,
    user?: CurrentUser,
  ): Promise<PaginatedResult<Restaurant>> {
    const where: Prisma.RestaurantWhereInput = {};
    if (user && isPartner(user)) {
      where.id = requirePartnerRestaurantId(user);
    }

    return paginate(
      (args) =>
        this.prisma.restaurant.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: args.skip,
          take: args.take,
        }),
      () => this.prisma.restaurant.count({ where }),
      pagination,
    );
  }

  findOne(id: string): Promise<Restaurant> {
    return this.prisma.restaurant.findUniqueOrThrow({ where: { id } });
  }

  async update(
    id: string,
    data: Partial<UpdateRestaurantInput>,
    user?: CurrentUser,
  ): Promise<Restaurant> {
    if (user) {
      assertRestaurantAccess(user, id);
    }
    return this.prisma.restaurant
      .update({
        where: { id },
        data,
      })
      .catch(() => {
        throw new NotFoundException(`Restaurant ${id} not found`);
      });
  }

  remove(id: string): Promise<Restaurant> {
    return this.prisma.restaurant.delete({ where: { id } }).catch(() => {
      throw new NotFoundException(`Restaurant ${id} not found`);
    });
  }
}
