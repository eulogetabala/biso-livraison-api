import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DeliveryStatus, DriverLocation } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateDriverLocationInput } from './dto/update-driver-location.input';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

const ACTIVE_DELIVERY_STATUSES: DeliveryStatus[] = [
  DeliveryStatus.ASSIGNED,
  DeliveryStatus.PICKED_UP,
  DeliveryStatus.IN_TRANSIT,
];

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

  async getActiveDeliveriesTracking() {
    const deliveries = await this.prisma.delivery.findMany({
      where: { status: { in: ACTIVE_DELIVERY_STATUSES } },
      include: {
        order: {
          include: {
            user: true,
            restaurant: true,
          },
        },
        parcel: {
          include: {
            sender: true,
          },
        },
        driver: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    const driverIds = deliveries.map((d) => d.driverId);
    const locations = await this.prisma.driverLocation.findMany({
      where: { driverId: { in: driverIds } },
    });
    const locationByDriver = new Map(locations.map((l) => [l.driverId, l]));

    return deliveries.map((delivery) => {
      const loc = locationByDriver.get(delivery.driverId);
      if (delivery.parcel) {
        return {
          deliveryId: delivery.id,
          orderId: delivery.orderId ?? delivery.parcelId!,
          parcelId: delivery.parcelId ?? undefined,
          deliveryStatus: delivery.status,
          orderStatus: delivery.order?.status,
          driverId: delivery.driverId,
          driverFirstName: delivery.driver.firstName,
          driverLastName: delivery.driver.lastName,
          driverPhone: delivery.driver.phone,
          driverLatitude: loc?.latitude,
          driverLongitude: loc?.longitude,
          locationUpdatedAt: loc?.updatedAt,
          restaurantName: 'Expédition colis',
          restaurantLatitude: -4.2634,
          restaurantLongitude: 15.2429,
          deliveryAddress: delivery.parcel.receiverAddress,
          deliveryCity: 'Brazzaville',
          deliveryLatitude: undefined,
          deliveryLongitude: undefined,
          clientFirstName: delivery.parcel.sender.firstName,
          clientLastName: delivery.parcel.sender.lastName,
        };
      }

      return {
        deliveryId: delivery.id,
        orderId: delivery.orderId!,
        parcelId: undefined,
        deliveryStatus: delivery.status,
        orderStatus: delivery.order!.status,
        driverId: delivery.driverId,
        driverFirstName: delivery.driver.firstName,
        driverLastName: delivery.driver.lastName,
        driverPhone: delivery.driver.phone,
        driverLatitude: loc?.latitude,
        driverLongitude: loc?.longitude,
        locationUpdatedAt: loc?.updatedAt,
        restaurantName: delivery.order!.restaurant.name,
        restaurantLatitude: delivery.order!.restaurant.latitude ?? undefined,
        restaurantLongitude: delivery.order!.restaurant.longitude ?? undefined,
        deliveryAddress: delivery.order!.deliveryAddress,
        deliveryCity: delivery.order!.deliveryCity,
        deliveryLatitude: delivery.order!.deliveryLatitude ?? undefined,
        deliveryLongitude: delivery.order!.deliveryLongitude ?? undefined,
        clientFirstName: delivery.order!.user.firstName,
        clientLastName: delivery.order!.user.lastName,
      };
    });
  }
}
