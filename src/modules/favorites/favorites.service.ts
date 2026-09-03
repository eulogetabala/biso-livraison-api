import { Injectable } from '@nestjs/common';
import { Favorite, FavoriteKind } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ToggleFavoriteInput } from './dto/toggle-favorite.input';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  myFavorites(userId: string): Promise<Favorite[]> {
    return this.prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggle(userId: string, input: ToggleFavoriteInput): Promise<Favorite | null> {
    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_targetId_kind: {
          userId,
          targetId: input.targetId,
          kind: input.kind,
        },
      },
    });

    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } });
      return null;
    }

    return this.prisma.favorite.create({
      data: {
        userId,
        targetId: input.targetId,
        kind: input.kind,
        name: input.name,
        imageUrl: input.imageUrl,
        price: input.price,
        seller: input.seller,
        cuisineType: input.cuisineType,
        rating: input.rating,
        city: input.city,
      },
    });
  }

  async remove(userId: string, targetId: string, kind: FavoriteKind): Promise<boolean> {
    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_targetId_kind: { userId, targetId, kind },
      },
    });

    if (!existing) return false;

    await this.prisma.favorite.delete({ where: { id: existing.id } });
    return true;
  }
}
