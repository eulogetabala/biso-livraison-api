import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Delivery,
  DeliveryStatus,
  NotificationType,
  OrderStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

const deliveryInclude = {
  order: { include: { items: { include: { menuItem: true } } } },
  driver: true,
} as const;

const ALLOWED_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  [DeliveryStatus.ASSIGNED]: [
    DeliveryStatus.PICKED_UP,
    DeliveryStatus.IN_TRANSIT,
  ],
  [DeliveryStatus.PICKED_UP]: [DeliveryStatus.IN_TRANSIT],
  [DeliveryStatus.IN_TRANSIT]: [DeliveryStatus.DELIVERED],
  [DeliveryStatus.DELIVERED]: [],
};

const ORDER_STATUS_BY_DELIVERY: Record<DeliveryStatus, OrderStatus> = {
  [DeliveryStatus.ASSIGNED]: OrderStatus.CONFIRMED,
  [DeliveryStatus.PICKED_UP]: OrderStatus.IN_TRANSIT,
  [DeliveryStatus.IN_TRANSIT]: OrderStatus.IN_TRANSIT,
  [DeliveryStatus.DELIVERED]: OrderStatus.DELIVERED,
};

@Injectable()
export class DeliveriesService {
  constructor(private readonly prisma: PrismaService) {}

  async assign(orderId: string, driverId: string): Promise<Delivery> {
    const [driver, order] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: driverId } }),
      this.prisma.order.findUnique({
        where: { id: orderId },
        include: { delivery: true },
      }),
    ]);

    if (!driver) {
      throw new NotFoundException(`Driver ${driverId} not found`);
    }
    if (driver.role !== UserRole.DRIVER) {
      throw new BadRequestException('The assigned user is not a driver');
    }
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException(
        'Cannot assign a driver to a cancelled order',
      );
    }
    if (order.delivery) {
      throw new BadRequestException(
        'A driver is already assigned to this order',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CONFIRMED },
      });

      await tx.notification.create({
        data: {
          userId: order.userId,
          type: NotificationType.DELIVERY_STATUS,
          title: 'Livreur assigné',
          message: 'Un livreur a été assigné à votre commande',
        },
      });

      return tx.delivery.create({
        data: {
          orderId,
          driverId,
          status: DeliveryStatus.ASSIGNED,
        },
        include: deliveryInclude,
      });
    });
  }

  findAll(): Promise<Delivery[]> {
    return this.prisma.delivery.findMany({
      include: deliveryInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  myDeliveries(driverId: string): Promise<Delivery[]> {
    return this.prisma.delivery.findMany({
      where: { driverId },
      include: deliveryInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  findByOrder(orderId: string): Promise<Delivery> {
    return this.prisma.delivery
      .findUniqueOrThrow({
        where: { orderId },
        include: deliveryInclude,
      })
      .catch(() => {
        throw new NotFoundException(`No delivery for order ${orderId}`);
      });
  }

  async updateStatus(
    id: string,
    status: DeliveryStatus,
    currentUser: CurrentUser,
  ): Promise<Delivery> {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id },
      include: deliveryInclude,
    });

    if (!delivery) {
      throw new NotFoundException(`Delivery ${id} not found`);
    }

    const isDriver = delivery.driverId === currentUser.id;
    const isAdmin = currentUser.role === UserRole.ADMIN;
    if (!isDriver && !isAdmin) {
      throw new ForbiddenException(
        'Only the assigned driver can update this delivery',
      );
    }

    const allowed = ALLOWED_TRANSITIONS[delivery.status];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Cannot transition delivery from ${delivery.status} to ${status}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: delivery.orderId },
        data: { status: ORDER_STATUS_BY_DELIVERY[status] },
      });

      await tx.notification.create({
        data: {
          userId: delivery.order.userId,
          type: NotificationType.DELIVERY_STATUS,
          title:
            status === DeliveryStatus.DELIVERED
              ? 'Commande livrée'
              : 'Suivi de livraison',
          message:
            status === DeliveryStatus.DELIVERED
              ? 'Votre commande a été livrée. Bon appétit !'
              : `Votre livraison est maintenant : ${status}`,
        },
      });

      return tx.delivery.update({
        where: { id },
        data: {
          status,
          pickedUpAt:
            status === DeliveryStatus.PICKED_UP ? new Date() : undefined,
          deliveredAt:
            status === DeliveryStatus.DELIVERED ? new Date() : undefined,
        },
        include: deliveryInclude,
      });
    });
  }

  remove(id: string): Promise<Delivery> {
    return this.prisma.delivery.delete({ where: { id } }).catch(() => {
      throw new NotFoundException(`Delivery ${id} not found`);
    });
  }
}
