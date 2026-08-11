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

  async overview() {
    const [
      totalOrders,
      revenueAgg,
      activeRestaurants,
      activeDrivers,
      pendingOrders,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.aggregate({
        where: { status: { in: REVENUE_STATUSES } },
        _sum: { total: true },
      }),
      this.prisma.restaurant.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { role: 'DRIVER' } }),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
    ]);

    const totalRevenue = revenueAgg._sum.total ?? 0;

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      activeRestaurants,
      activeDrivers,
      pendingOrders,
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
      _sum: { total: true },
      _count: { _all: true },
      orderBy: { _sum: { total: 'desc' } },
    });

    const restaurants = await this.prisma.restaurant.findMany({
      where: { id: { in: rows.map((r) => r.restaurantId) } },
      select: { id: true, name: true },
    });

    const nameById = new Map(restaurants.map((r) => [r.id, r.name]));

    return rows.map((row) => ({
      restaurantId: row.restaurantId,
      restaurantName: nameById.get(row.restaurantId) ?? 'Unknown',
      revenue: row._sum.total ?? 0,
      orderCount: row._count._all,
    }));
  }

  async ordersByStatus() {
    const groups = await this.prisma.order.groupBy({
      by: ['status'],
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
      select: { createdAt: true, total: true, status: true },
      orderBy: { createdAt: 'asc' },
    });

    const byDay = new Map<string, { orders: number; revenue: number }>();

    for (const order of orders) {
      const day = order.createdAt.toISOString().slice(0, 10);
      const entry = byDay.get(day) ?? { orders: 0, revenue: 0 };
      entry.orders += 1;
      if (REVENUE_STATUSES.includes(order.status)) {
        entry.revenue += order.total;
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

    const rows = await this.prisma.order.groupBy({
      by: ['restaurantId'],
      where: { status: { in: REVENUE_STATUSES } },
      _sum: { total: true },
      _count: { _all: true },
      orderBy: { _sum: { total: 'desc' } },
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
      revenue: row._sum.total ?? 0,
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
