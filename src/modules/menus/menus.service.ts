import { Injectable, NotFoundException } from '@nestjs/common';
import { MenuItem } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMenuItemInput } from './dto/create-menu-item.input';
import { UpdateMenuItemInput } from './dto/update-menu-item.input';

@Injectable()
export class MenusService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateMenuItemInput): Promise<MenuItem> {
    return this.prisma.menuItem.create({ data });
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
