import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DriverLocation } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateDriverLocationInput } from './dto/update-driver-location.input';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Injectable()
export class GeoService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertLocation(
    driverId: string,
    input: UpdateDriverLocationInput,
  ): Promise<DriverLocation> {
    return this.prisma.driverLocation.upsert({
      where: { driverId },
      update: {
        latitude: input.latitude,
        longitude: input.longitude,
        deliveryId: input.deliveryId ?? null,
      },
      create: {
        driverId,
        latitude: input.latitude,
        longitude: input.longitude,
        deliveryId: input.deliveryId,
      },
    });
  }

  async getLocation(driverId: string): Promise<DriverLocation> {
    const location = await this.prisma.driverLocation.findUnique({
      where: { driverId },
    });

    if (!location) {
      throw new NotFoundException(
        `No location recorded for driver ${driverId}`,
      );
    }

    return location;
  }

  async trackDelivery(orderId: string, currentUser: CurrentUser) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (order.userId !== currentUser.id && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('You cannot track this order');
    }

    const delivery = await this.prisma.delivery.findUnique({
      where: { orderId },
      select: { driverId: true },
    });

    if (!delivery?.driverId) {
      throw new NotFoundException(`No driver assigned to order ${orderId} yet`);
    }

    return this.getLocation(delivery.driverId);
  }

  getAllLocations(): Promise<DriverLocation[]> {
    return this.prisma.driverLocation.findMany({
      orderBy: { updatedAt: 'desc' },
    });
  }
}
