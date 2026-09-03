import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  StatisticsRangeInput,
  TopRestaurantsInput,
} from './dto/statistics.inputs';

const REVENUE_STATUSES: OrderStatus[] = [
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.IN_TRANSIT,
  OrderStatus.DELIVERED,
];

@Injectable()
export class StatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(range: StatisticsRangeInput = {}) {
    const dateWhere = this.dateRangeWhere(range);
    const revenueWhere: Prisma.OrderWhereInput = {
      status: { in: REVENUE_STATUSES },
      ...dateWhere,
    };
    const ordersWhere: Prisma.OrderWhereInput = { ...dateWhere };

    const [
      totalOrders,
      revenueAgg,
      revenueOrderCount,
      activeRestaurants,
      activeDrivers,
      pendingOrders,
      totalDriverProfiles,
      availableDriverProfiles,
    ] = await Promise.all([
      this.prisma.order.count({ where: ordersWhere }),
      this.prisma.order.aggregate({
        where: revenueWhere,
        _sum: { grandTotal: true },
      }),
      this.prisma.order.count({ where: revenueWhere }),
      this.prisma.restaurant.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { role: 'DRIVER' } }),
      this.prisma.order.count({
        where: { status: OrderStatus.PENDING, ...dateWhere },
      }),
      this.prisma.driverProfile.count(),
      this.prisma.driverProfile.count({ where: { isAvailable: true } }),
    ]);

    const totalRevenue = revenueAgg._sum.grandTotal ?? 0;

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue:
        revenueOrderCount > 0 ? totalRevenue / revenueOrderCount : 0,
      activeRestaurants,
      activeDrivers,
      pendingOrders,
      totalDriverProfiles,
      availableDriverProfiles,
    };
  }

  async revenueByRestaurant(range: StatisticsRangeInput) {
    const where: Prisma.OrderWhereInput = {
      status: { in: REVENUE_STATUSES },
      ...this.dateRangeWhere(range),
    };

    const rows = await this.prisma.order.groupBy({
      by: ['restaurantId'],
      where,
      _sum: { grandTotal: true },
      _count: { _all: true },
      orderBy: { _sum: { grandTotal: 'desc' } },
    });

    const restaurants = await this.prisma.restaurant.findMany({
      where: { id: { in: rows.map((r) => r.restaurantId) } },
      select: { id: true, name: true },
    });

    const nameById = new Map(restaurants.map((r) => [r.id, r.name]));

    return rows.map((row) => ({
      restaurantId: row.restaurantId,
      restaurantName: nameById.get(row.restaurantId) ?? 'Unknown',
      revenue: row._sum.grandTotal ?? 0,
      orderCount: row._count._all,
    }));
  }

  async ordersByStatus(range: StatisticsRangeInput = {}) {
    const where = this.dateRangeWhere(range);

    const groups = await this.prisma.order.groupBy({
      by: ['status'],
      where,
      _count: { _all: true },
    });

    const countByStatus = new Map(groups.map((g) => [g.status, g._count._all]));

    return Object.values(OrderStatus).map((status) => ({
      status,
      count: countByStatus.get(status) ?? 0,
    }));
  }

  async dailyOrders(range: StatisticsRangeInput) {
    const where: Prisma.OrderWhereInput = {
      ...this.dateRangeWhere(range),
    };

    const orders = await this.prisma.order.findMany({
      where,
      select: { createdAt: true, grandTotal: true, status: true },
      orderBy: { createdAt: 'asc' },
    });

    const byDay = new Map<string, { orders: number; revenue: number }>();

    for (const order of orders) {
      const day = order.createdAt.toISOString().slice(0, 10);
      const entry = byDay.get(day) ?? { orders: 0, revenue: 0 };
      entry.orders += 1;
      if (REVENUE_STATUSES.includes(order.status)) {
        entry.revenue += order.grandTotal;
      }
      byDay.set(day, entry);
    }

    return [...byDay.entries()].map(([date, value]) => ({
      date,
      ...value,
    }));
  }

  async topRestaurants(input: TopRestaurantsInput) {
    const limit = input.limit ?? 5;
    const range: StatisticsRangeInput = { from: input.from, to: input.to };

    const rows = await this.prisma.order.groupBy({
      by: ['restaurantId'],
      where: {
        status: { in: REVENUE_STATUSES },
        ...this.dateRangeWhere(range),
      },
      _sum: { grandTotal: true },
      _count: { _all: true },
      orderBy: { _sum: { grandTotal: 'desc' } },
      take: limit,
    });

    const restaurants = await this.prisma.restaurant.findMany({
      where: { id: { in: rows.map((r) => r.restaurantId) } },
      select: { id: true, name: true },
    });

    const nameById = new Map(restaurants.map((r) => [r.id, r.name]));

    return rows.map((row) => ({
      restaurantId: row.restaurantId,
      restaurantName: nameById.get(row.restaurantId) ?? 'Unknown',
      revenue: row._sum.grandTotal ?? 0,
      orderCount: row._count._all,
    }));
  }

  private dateRangeWhere(range: StatisticsRangeInput): Prisma.OrderWhereInput {
    if (!range.from && !range.to) {
      return {};
    }

    const where: Prisma.OrderWhereInput = { createdAt: {} };

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
