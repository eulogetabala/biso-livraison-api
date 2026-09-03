import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { FavoriteKind } from '@prisma/client';
import { FavoritesService } from './favorites.service';
import { FavoriteModel } from './models/favorite.model';
import { ToggleFavoriteInput } from './dto/toggle-favorite.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => FavoriteModel)
export class FavoritesResolver {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Query(() => [FavoriteModel])
  @UseGuards(JwtAuthGuard)
  myFavorites(@CurrentUser() user: CurrentUser) {
    return this.favoritesService.myFavorites(user.id);
  }

  @Mutation(() => FavoriteModel, { nullable: true })
  @UseGuards(JwtAuthGuard)
  toggleFavorite(
    @Args('input') input: ToggleFavoriteInput,
    @CurrentUser() user: CurrentUser,
  ) {
    return this.favoritesService.toggle(user.id, input);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  removeFavorite(
    @Args('targetId') targetId: string,
    @Args('kind', { type: () => FavoriteKind }) kind: FavoriteKind,
    @CurrentUser() user: CurrentUser,
  ) {
    return this.favoritesService.remove(user.id, targetId, kind);
  }
}
