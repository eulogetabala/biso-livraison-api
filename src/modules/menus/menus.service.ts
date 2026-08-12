import { Injectable, NotFoundException } from '@nestjs/common';
import { MenuItem, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMenuItemInput } from './dto/create-menu-item.input';
import { UpdateMenuItemInput } from './dto/update-menu-item.input';
import { SearchMenuItemsInput } from './dto/search-menu-items.input';

@Injectable()
export class MenusService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateMenuItemInput): Promise<MenuItem> {
    return this.prisma.menuItem.create({ data });
  }

  search(input: SearchMenuItemsInput = {}): Promise<MenuItem[]> {
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

    return this.prisma.menuItem.findMany({
      where,
      include: { restaurant: true },
      orderBy: { name: 'asc' },
    });
  }

  findAll(): Promise<MenuItem[]> {
    return this.prisma.menuItem.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  findByRestaurant(restaurantId: string): Promise<MenuItem[]> {
    return this.prisma.menuItem.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
    });
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
