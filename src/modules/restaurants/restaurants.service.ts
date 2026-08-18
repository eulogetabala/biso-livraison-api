import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Restaurant } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
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
      where.cuisineType = { equals: input.cuisineType, mode: 'insensitive' };
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
          orderBy: [{ rating: 'desc' }, { name: 'asc' }],
          skip: args.skip,
          take: args.take,
        }),
      () => this.prisma.restaurant.count({ where }),
      pagination,
    );
  }

  findAll(pagination: PaginationArgs): Promise<PaginatedResult<Restaurant>> {
    return paginate(
      (args) =>
        this.prisma.restaurant.findMany({
          orderBy: { createdAt: 'desc' },
          skip: args.skip,
          take: args.take,
        }),
      () => this.prisma.restaurant.count(),
      pagination,
    );
  }

  findOne(id: string): Promise<Restaurant> {
    return this.prisma.restaurant.findUniqueOrThrow({ where: { id } });
  }

  update(
    id: string,
    data: Partial<UpdateRestaurantInput>,
  ): Promise<Restaurant> {
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
