import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MenuItem, MenuItemKind, Prisma, RestaurantType, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  assertRestaurantAccess,
  isPartner,
  requirePartnerRestaurantId,
} from '../../common/utils/partner-scope.util';
import { CreateMenuItemInput } from './dto/create-menu-item.input';
import { UpdateMenuItemInput } from './dto/update-menu-item.input';
import { SearchMenuItemsInput } from './dto/search-menu-items.input';
import { UpsertMenuItemSupplementInput } from './dto/upsert-menu-item-supplement.input';
import { PaginationArgs } from '../../common/dto/pagination.args';
import { paginate, PaginatedResult } from '../../common/utils/pagination.util';

const menuItemInclude = {
  restaurant: true,
  marketCategory: true,
  supplements: {
    orderBy: [{ sortOrder: 'asc' as const }, { name: 'asc' as const }],
  },
} satisfies Prisma.MenuItemInclude;

@Injectable()
export class MenusService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateMenuItemInput, user: CurrentUser): Promise<MenuItem> {
    if (isPartner(user)) {
      if ((data.kind ?? MenuItemKind.RESTAURANT_DISH) === MenuItemKind.SIMPLE_PRODUCT) {
        throw new ForbiddenException('Partners cannot manage market products');
      }
      assertRestaurantAccess(user, data.restaurantId);
    }
    const payload = this.normalizeCreateInput(data);
    return this.prisma.menuItem.create({ data: payload, include: menuItemInclude });
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
          include: menuItemInclude,
          orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
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
          include: menuItemInclude,
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
    const where: Prisma.MenuItemWhereInput = {
      restaurantId,
      kind: MenuItemKind.RESTAURANT_DISH,
    };

    return paginate(
      (args) =>
        this.prisma.menuItem.findMany({
          where,
          include: menuItemInclude,
          orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
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

    if (input.simpleProductsOnly) {
      where.kind = MenuItemKind.SIMPLE_PRODUCT;
      where.restaurantId = null;
    } else if (input.restaurantDishesOnly) {
      where.kind = MenuItemKind.RESTAURANT_DISH;
    } else if (input.kind) {
      where.kind = input.kind;
    }

    if (input.category) {
      where.category = input.category;
    }

    if (input.onlyAvailable !== false) {
      where.isAvailable = true;
    }

    if (input.query) {
      const q = { contains: input.query, mode: 'insensitive' as const };
      where.OR = [{ name: q }, { description: q }, { seller: q }];
    }

    if (input.marketCategoryId) {
      where.marketCategoryId = input.marketCategoryId;
    }

    if (input.featuredOnly) {
      where.isFeatured = true;
    }

    return where;
  }

  findOne(id: string): Promise<MenuItem> {
    return this.prisma.menuItem.findUniqueOrThrow({
      where: { id },
      include: menuItemInclude,
    });
  }

  async update(
    id: string,
    data: Partial<UpdateMenuItemInput>,
    user: CurrentUser,
  ): Promise<MenuItem> {
    await this.assertMenuItemAccess(id, user);
    const { id: _id, ...rest } = data;
    const payload = this.normalizeUpdateInput(rest, user);
    return this.prisma.menuItem
      .update({ where: { id }, data: payload, include: menuItemInclude })
      .catch(() => {
        throw new NotFoundException(`MenuItem ${id} not found`);
      });
  }

  async remove(id: string, user: CurrentUser): Promise<MenuItem> {
    await this.assertMenuItemAccess(id, user);
    return this.prisma.menuItem.delete({ where: { id } }).catch(() => {
      throw new NotFoundException(`MenuItem ${id} not found`);
    });
  }

  async upsertSupplement(input: UpsertMenuItemSupplementInput, user: CurrentUser) {
    await this.assertMenuItemAccess(input.menuItemId, user);
    if (input.id) {
      const existing = await this.prisma.menuItemSupplement.findUnique({
        where: { id: input.id },
      });
      if (existing) {
        await this.assertMenuItemAccess(existing.menuItemId, user);
      }
    }
    const data = {
      menuItemId: input.menuItemId,
      name: input.name.trim(),
      price: input.price,
      isAvailable: input.isAvailable ?? true,
      sortOrder: input.sortOrder ?? 0,
    };

    if (input.id) {
      return this.prisma.menuItemSupplement.update({
        where: { id: input.id },
        data,
      });
    }

    return this.prisma.menuItemSupplement.create({ data });
  }

  async deleteSupplement(id: string, user: CurrentUser) {
    const supplement = await this.prisma.menuItemSupplement.findUnique({
      where: { id },
    });
    if (!supplement) {
      throw new NotFoundException(`Supplement ${id} not found`);
    }
    await this.assertMenuItemAccess(supplement.menuItemId, user);
    return this.prisma.menuItemSupplement.delete({ where: { id } });
  }

  async catalogStats(user: CurrentUser) {
    const partnerRestaurantId = isPartner(user)
      ? requirePartnerRestaurantId(user)
      : null;

    const [restaurants, menuDishes, simpleProducts, supplements] = await Promise.all([
      partnerRestaurantId
        ? this.prisma.restaurant.count({ where: { id: partnerRestaurantId } })
        : this.prisma.restaurant.count({ where: { type: RestaurantType.RESTAURANT } }),
      this.prisma.menuItem.count({
        where: {
          kind: MenuItemKind.RESTAURANT_DISH,
          ...(partnerRestaurantId ? { restaurantId: partnerRestaurantId } : {}),
        },
      }),
      partnerRestaurantId
        ? Promise.resolve(0)
        : this.prisma.menuItem.count({ where: { kind: MenuItemKind.SIMPLE_PRODUCT } }),
      this.prisma.menuItemSupplement.count({
        where: partnerRestaurantId
          ? { menuItem: { restaurantId: partnerRestaurantId } }
          : undefined,
      }),
    ]);
    return { restaurants, menuDishes, simpleProducts, supplements };
  }

  private async assertMenuItemAccess(
    menuItemId: string,
    user: CurrentUser,
  ): Promise<void> {
    if (user.role === UserRole.ADMIN) {
      return;
    }
    const item = await this.prisma.menuItem.findUnique({
      where: { id: menuItemId },
      select: { restaurantId: true, kind: true },
    });
    if (!item) {
      throw new NotFoundException(`MenuItem ${menuItemId} not found`);
    }
    if (item.kind === MenuItemKind.SIMPLE_PRODUCT) {
      throw new ForbiddenException('Partners cannot manage market products');
    }
    assertRestaurantAccess(user, item.restaurantId);
  }

  private normalizeCreateInput(data: CreateMenuItemInput): Prisma.MenuItemCreateInput {
    const kind = data.kind ?? MenuItemKind.RESTAURANT_DISH;

    if (kind === MenuItemKind.SIMPLE_PRODUCT) {
      if (!data.seller?.trim()) {
        throw new BadRequestException('Le vendeur est obligatoire pour un produit simple.');
      }
      if (!data.marketCategoryId) {
        throw new BadRequestException('La catégorie produit est obligatoire.');
      }
      return {
        kind,
        name: data.name.trim(),
        description: data.description?.trim(),
        price: data.price,
        category: data.category,
        imageUrl: data.imageUrl,
        isAvailable: data.isAvailable ?? true,
        seller: data.seller.trim(),
        badge: data.badge?.trim(),
        isFeatured: data.isFeatured ?? false,
        sortOrder: data.sortOrder ?? 0,
        marketCategory: { connect: { id: data.marketCategoryId } },
      };
    }

    if (!data.restaurantId) {
      throw new BadRequestException('Le restaurant est obligatoire pour un plat.');
    }

    return {
      kind: MenuItemKind.RESTAURANT_DISH,
      name: data.name.trim(),
      description: data.description?.trim(),
      price: data.price,
      category: data.category,
      imageUrl: data.imageUrl,
      isAvailable: data.isAvailable ?? true,
      isFeatured: data.isFeatured ?? false,
      sortOrder: data.sortOrder ?? 0,
      restaurant: { connect: { id: data.restaurantId } },
    };
  }

  private normalizeUpdateInput(
    data: Partial<Omit<UpdateMenuItemInput, 'id'>>,
    user?: CurrentUser,
  ): Prisma.MenuItemUpdateInput {
    const payload: Prisma.MenuItemUpdateInput = {};

    if (data.name !== undefined) payload.name = data.name.trim();
    if (data.description !== undefined) payload.description = data.description?.trim();
    if (data.price !== undefined) payload.price = data.price;
    if (data.category !== undefined) payload.category = data.category;
    if (data.imageUrl !== undefined) payload.imageUrl = data.imageUrl || null;
    if (data.isAvailable !== undefined) payload.isAvailable = data.isAvailable;
    if (data.isFeatured !== undefined) payload.isFeatured = data.isFeatured;
    if (data.sortOrder !== undefined) payload.sortOrder = data.sortOrder;
    if (data.seller !== undefined) payload.seller = data.seller?.trim() || null;
    if (data.badge !== undefined) payload.badge = data.badge?.trim() || null;
    if (data.marketCategoryId !== undefined) {
      payload.marketCategory = data.marketCategoryId
        ? { connect: { id: data.marketCategoryId } }
        : { disconnect: true };
    }
    if (data.restaurantId !== undefined && data.restaurantId) {
      if (user) {
        assertRestaurantAccess(user, data.restaurantId);
      }
      payload.restaurant = { connect: { id: data.restaurantId } };
    }

    return payload;
  }
}
