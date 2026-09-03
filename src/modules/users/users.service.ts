import { ForbiddenException, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma, User, UserRole, RestaurantType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationArgs } from '../../common/dto/pagination.args';
import { paginate, PaginatedResult } from '../../common/utils/pagination.util';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateProfileInput } from './dto/update-profile.input';
import { SearchUsersInput } from './dto/search-users.input';
import { AdminCreatePartnerInput } from './dto/admin-create-partner.input';
import { AdminUpdatePartnerInput } from './dto/admin-update-partner.input';
import { UserStatisticsRangeInput } from './models/user-statistics.models';
import * as bcrypt from 'bcrypt';

const partnerInclude = { partnerRestaurant: true } as const;

const CLIENT_WHERE: Prisma.UserWhereInput = { role: UserRole.CLIENT };

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserInput): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        password: hashedPassword,
        phoneVerified: false,
      },
    });
  }

  findAll(): Promise<User[]> {
    return this.prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  }

  search(
    pagination: PaginationArgs,
    input?: SearchUsersInput,
  ): Promise<PaginatedResult<User>> {
    const where = this.buildSearchWhere(input);

    return paginate(
      (args) =>
        this.prisma.user.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: args.skip,
          take: args.take,
        }),
      () => this.prisma.user.count({ where }),
      pagination,
    );
  }

  findById(id: string): Promise<User> {
    return this.prisma.user.findUniqueOrThrow({ where: { id } });
  }

  async updateProfile(userId: string, data: UpdateProfileInput): Promise<User> {
    const updateData: UpdateProfileInput = { ...data };

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  async deleteAccount(userId: string): Promise<User> {
    return this.prisma.user.delete({ where: { id: userId } });
  }

  registerPushToken(userId: string, token: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { expoPushToken: token },
    });
  }

  async adminSetBlocked(userId: string, isBlocked: boolean): Promise<User> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    if (user.role === UserRole.ADMIN) {
      throw new ForbiddenException('Impossible de bloquer un administrateur');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { isBlocked },
    });
  }

  findPartners() {
    return this.prisma.user.findMany({
      where: { role: UserRole.PARTNER },
      include: partnerInclude,
      orderBy: [{ partnerRestaurant: { name: 'asc' } }, { lastName: 'asc' }],
    });
  }

  async adminCreatePartner(input: AdminCreatePartnerInput) {
    await this.assertPartnerRestaurant(input.partnerRestaurantId);

    const normalizedPhone = input.phone.trim().replace(/\s+/g, '');
    const existing = await this.prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });
    if (existing) {
      throw new BadRequestException('Un compte existe déjà avec ce numéro.');
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);

    return this.prisma.user.create({
      data: {
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        phone: normalizedPhone,
        password: hashedPassword,
        role: UserRole.PARTNER,
        phoneVerified: true,
        partnerRestaurantId: input.partnerRestaurantId,
      },
      include: partnerInclude,
    });
  }

  async adminUpdatePartner(input: AdminUpdatePartnerInput) {
    const user = await this.prisma.user.findUnique({
      where: { id: input.userId },
    });

    if (!user) {
      throw new NotFoundException(`User ${input.userId} not found`);
    }
    if (user.role !== UserRole.PARTNER) {
      throw new BadRequestException('This user is not a partner account');
    }

    if (input.partnerRestaurantId) {
      await this.assertPartnerRestaurant(input.partnerRestaurantId);
    }

    if (input.phone?.trim()) {
      const normalizedPhone = input.phone.trim().replace(/\s+/g, '');
      const existing = await this.prisma.user.findUnique({
        where: { phone: normalizedPhone },
      });
      if (existing && existing.id !== user.id) {
        throw new BadRequestException('Un compte existe déjà avec ce numéro.');
      }
    }

    const data: Prisma.UserUpdateInput = {};

    if (input.firstName?.trim()) data.firstName = input.firstName.trim();
    if (input.lastName?.trim()) data.lastName = input.lastName.trim();
    if (input.phone?.trim()) data.phone = input.phone.trim().replace(/\s+/g, '');
    if (input.password) data.password = await bcrypt.hash(input.password, 10);
    if (input.partnerRestaurantId) {
      data.partnerRestaurant = { connect: { id: input.partnerRestaurantId } };
    }
    if (input.isBlocked !== undefined) data.isBlocked = input.isBlocked;

    return this.prisma.user.update({
      where: { id: user.id },
      data,
      include: partnerInclude,
    });
  }

  private async assertPartnerRestaurant(restaurantId: string): Promise<void> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant ${restaurantId} not found`);
    }
    if (restaurant.type === RestaurantType.MARKET) {
      throw new BadRequestException(
        'Un partenaire doit être lié à un restaurant, pas au marché.',
      );
    }
  }

  async statisticsOverview(range: UserStatisticsRangeInput = {}) {
    const periodWhere = this.dateRangeWhere(range);
    const clientPeriodWhere: Prisma.UserWhereInput = {
      ...CLIENT_WHERE,
      ...periodWhere,
    };

    const [
      totalClients,
      newRegistrations,
      verifiedRegistrations,
      pendingOtp,
      blockedClients,
    ] = await Promise.all([
      this.prisma.user.count({ where: CLIENT_WHERE }),
      this.prisma.user.count({ where: clientPeriodWhere }),
      this.prisma.user.count({
        where: { ...clientPeriodWhere, phoneVerified: true },
      }),
      this.prisma.user.count({
        where: {
          ...CLIENT_WHERE,
          phoneVerified: false,
          isBlocked: false,
        },
      }),
      this.prisma.user.count({
        where: { ...CLIENT_WHERE, isBlocked: true },
      }),
    ]);

    return {
      totalClients,
      newRegistrations,
      verifiedRegistrations,
      pendingOtp,
      blockedClients,
    };
  }

  async dailyRegistrations(range: UserStatisticsRangeInput = {}) {
    const where: Prisma.UserWhereInput = {
      ...CLIENT_WHERE,
      ...this.dateRangeWhere(range),
    };

    const users = await this.prisma.user.findMany({
      where,
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const byDay = new Map<string, number>();

    for (const user of users) {
      const day = user.createdAt.toISOString().slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + 1);
    }

    return [...byDay.entries()].map(([date, count]) => ({ date, count }));
  }

  private buildSearchWhere(input?: SearchUsersInput): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {
      role: input?.role ?? UserRole.CLIENT,
    };

    if (input?.phoneVerified !== undefined) {
      where.phoneVerified = input.phoneVerified;
    }

    if (input?.isBlocked !== undefined) {
      where.isBlocked = input.isBlocked;
    }

    if (input?.from || input?.to) {
      where.createdAt = {};
      if (input.from) {
        where.createdAt.gte = new Date(input.from);
      }
      if (input.to) {
        const to = new Date(input.to);
        to.setUTCHours(23, 59, 59, 999);
        where.createdAt.lte = to;
      }
    }

    if (input?.search?.trim()) {
      const q = input.search.trim();
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private dateRangeWhere(range: UserStatisticsRangeInput): Prisma.UserWhereInput {
    if (!range.from && !range.to) {
      return {};
    }

    const where: Prisma.UserWhereInput = { createdAt: {} };

    if (range.from) {
      where.createdAt = {
        ...(where.createdAt as object),
        gte: new Date(range.from),
      };
    }

    if (range.to) {
      const to = new Date(range.to);
      to.setUTCHours(23, 59, 59, 999);
      where.createdAt = {
        ...(where.createdAt as object),
        lte: to,
      };
    }

    return where;
  }
}
