import { Injectable, NotFoundException } from '@nestjs/common';
import { Restaurant } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRestaurantInput } from './dto/create-restaurant.input';
import { UpdateRestaurantInput } from './dto/update-restaurant.input';

@Injectable()
export class RestaurantsService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateRestaurantInput): Promise<Restaurant> {
    return this.prisma.restaurant.create({ data });
  }

  findAll(): Promise<Restaurant[]> {
    return this.prisma.restaurant.findMany({
      orderBy: { createdAt: 'desc' },
    });
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
