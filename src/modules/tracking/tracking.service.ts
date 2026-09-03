import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DeliveryStatus, TrackingEvent, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AddTrackingEventInput } from './dto/add-tracking-event.input';

const trackingInclude = { delivery: true } as const;

@Injectable()
export class TrackingService {
  constructor(private readonly prisma: PrismaService) {}

  async addEvent(
    input: AddTrackingEventInput,
    currentUser: CurrentUser,
  ): Promise<TrackingEvent> {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: input.deliveryId },
    });

    if (!delivery) {
      throw new NotFoundException(`Delivery ${input.deliveryId} not found`);
    }

    const isAssignedDriver = delivery.driverId === currentUser.id;
    const isAdmin = currentUser.role === UserRole.ADMIN;
    if (!isAssignedDriver && !isAdmin) {
      throw new ForbiddenException(
        'Only the assigned driver can update the tracking',
      );
    }

    return this.prisma.trackingEvent.create({
      data: {
        deliveryId: input.deliveryId,
        status: input.status,
        message: input.message,
        latitude: input.latitude,
        longitude: input.longitude,
      },
      include: trackingInclude,
    });
  }

  async getByDelivery(
    deliveryId: string,
    currentUser: CurrentUser,
  ): Promise<TrackingEvent[]> {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { order: true, parcel: true },
    });

    if (!delivery) {
      throw new NotFoundException(`Delivery ${deliveryId} not found`);
    }

    const isStaff =
      currentUser.role === UserRole.ADMIN ||
      currentUser.role === UserRole.PARTNER;
    const isDriver = delivery.driverId === currentUser.id;
    const isClient =
      delivery.order?.userId === currentUser.id ||
      delivery.parcel?.senderId === currentUser.id;

    if (!isClient && !isDriver && !isStaff) {
      throw new ForbiddenException(
        'You cannot view the tracking of this delivery',
      );
    }

    return this.prisma.trackingEvent.findMany({
      where: { deliveryId },
      include: trackingInclude,
      orderBy: { createdAt: 'asc' },
    });
  }

  recordMilestone(
    deliveryId: string,
    status: DeliveryStatus,
    message: string,
    latitude?: number,
    longitude?: number,
  ) {
    return this.prisma.trackingEvent.create({
      data: {
        deliveryId,
        status,
        message,
        latitude,
        longitude,
      },
    });
  }
}
