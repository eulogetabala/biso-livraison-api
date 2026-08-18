import { Injectable, NotFoundException } from '@nestjs/common';
import { MenuItem, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMenuItemInput } from './dto/create-menu-item.input';
import { UpdateMenuItemInput } from './dto/update-menu-item.input';
import { SearchMenuItemsInput } from './dto/search-menu-items.input';
import { PaginationArgs } from '../../common/dto/pagination.args';
import { paginate, PaginatedResult } from '../../common/utils/pagination.util';

@Injectable()
export class MenusService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateMenuItemInput): Promise<MenuItem> {
    return this.prisma.menuItem.create({ data });
  }

  search(
    input: SearchMenuItemsInput = {},
    pagination: PaginationArgs,
  ): Promise<PaginatedResult<MenuItem>> {
    const where = this.buildSearchWhere(input);

    return paginate(
      (args) =>
        this.prisma.menuItem.findMany({
          where,
          include: { restaurant: true },
          orderBy: { name: 'asc' },
          skip: args.skip,
          take: args.take,
        }),
      () => this.prisma.menuItem.count({ where }),
      pagination,
    );
  }

  findAll(pagination: PaginationArgs): Promise<PaginatedResult<MenuItem>> {
    return paginate(
      (args) =>
        this.prisma.menuItem.findMany({
          orderBy: { createdAt: 'desc' },
          skip: args.skip,
          take: args.take,
        }),
      () => this.prisma.menuItem.count(),
      pagination,
    );
  }

  findByRestaurant(
    restaurantId: string,
    pagination: PaginationArgs,
  ): Promise<PaginatedResult<MenuItem>> {
    const where: Prisma.MenuItemWhereInput = { restaurantId };

    return paginate(
      (args) =>
        this.prisma.menuItem.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: args.skip,
          take: args.take,
        }),
      () => this.prisma.menuItem.count({ where }),
      pagination,
    );
  }

  private buildSearchWhere(
    input: SearchMenuItemsInput,
  ): Prisma.MenuItemWhereInput {
    const where: Prisma.MenuItemWhereInput = {};

    if (input.restaurantId) {
      where.restaurantId = input.restaurantId;
    }

    if (input.category) {
      where.category = input.category;
    }

    if (input.onlyAvailable !== false) {
      where.isAvailable = true;
    }

    if (input.query) {
      const q = { contains: input.query, mode: 'insensitive' as const };
      where.OR = [{ name: q }, { description: q }];
    }

    return where;
  }

  findOne(id: string): Promise<MenuItem> {
    return this.prisma.menuItem.findUniqueOrThrow({ where: { id } });
  }

  update(id: string, data: Partial<UpdateMenuItemInput>): Promise<MenuItem> {
    return this.prisma.menuItem.update({ where: { id }, data }).catch(() => {
      throw new NotFoundException(`MenuItem ${id} not found`);
    });
  }

  remove(id: string): Promise<MenuItem> {
    return this.prisma.menuItem.delete({ where: { id } }).catch(() => {
      throw new NotFoundException(`MenuItem ${id} not found`);
    });
  }
}
