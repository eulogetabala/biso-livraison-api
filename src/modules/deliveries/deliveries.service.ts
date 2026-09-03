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
  ParcelStatus,
  Prisma,
  User,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MailService } from '../mail/mail.service';
import { SmsService } from '../sms/sms.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TrackingService } from '../tracking/tracking.service';
import { PaginationArgs } from '../../common/dto/pagination.args';
import { paginate, PaginatedResult } from '../../common/utils/pagination.util';

const deliveryInclude = {
  order: {
    include: {
      items: { include: { menuItem: true } },
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

const PARCEL_STATUS_BY_DELIVERY: Partial<Record<DeliveryStatus, ParcelStatus>> = {
  [DeliveryStatus.PICKED_UP]: ParcelStatus.PICKED_UP,
  [DeliveryStatus.IN_TRANSIT]: ParcelStatus.IN_TRANSIT,
  [DeliveryStatus.DELIVERED]: ParcelStatus.DELIVERED,
};

const ACTIVE_DELIVERY_STATUSES: DeliveryStatus[] = [
  DeliveryStatus.ASSIGNED,
  DeliveryStatus.PICKED_UP,
  DeliveryStatus.IN_TRANSIT,
];

type TransactionClient = Prisma.TransactionClient;

@Injectable()
export class DeliveriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly smsService: SmsService,
    private readonly notificationsService: NotificationsService,
    private readonly trackingService: TrackingService,
  ) {}

  async assignAvailableDriver(orderId: string): Promise<Delivery> {
    const { delivery, order, driver } = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          delivery: true,
          user: true,
          restaurant: true,
          items: { include: { menuItem: true } },
        },
      });

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

      const driver = await this.claimAvailableDriver(tx);
      if (!driver) {
        throw new BadRequestException(
          'No available driver right now. Please try again later.',
        );
      }

      const delivery = await this.createOrderDelivery(tx, orderId, driver.id);
      return { delivery, order, driver };
    });

    await this.afterOrderAssigned(delivery, order, driver);
    return delivery;
  }

  async assignAvailableDriverToParcel(parcelId: string): Promise<Delivery> {
    const { delivery, parcel, driver } = await this.prisma.$transaction(async (tx) => {
      const parcel = await tx.parcel.findUnique({
        where: { id: parcelId },
        include: { delivery: true, sender: true },
      });

      if (!parcel) {
        throw new NotFoundException(`Parcel ${parcelId} not found`);
      }
      if (parcel.status === ParcelStatus.CANCELLED || parcel.status === ParcelStatus.DELIVERED) {
        throw new BadRequestException('Cannot assign a driver to this parcel');
      }
      if (parcel.delivery) {
        throw new BadRequestException('A driver is already assigned to this parcel');
      }

      const driver = await this.claimAvailableDriver(tx);
      if (!driver) {
        throw new BadRequestException(
          'No available driver right now. Please try again later.',
        );
      }

      const delivery = await this.createParcelDelivery(tx, parcelId, driver.id);
      return { delivery, parcel, driver };
    });

    await this.afterParcelAssigned(delivery, parcel, driver);
    return delivery;
  }

  async assignToParcel(parcelId: string, driverId: string): Promise<Delivery> {
    const { delivery, parcel, driver } = await this.prisma.$transaction(async (tx) => {
      const driver = await this.assertDriverAssignable(tx, driverId);
      const parcel = await tx.parcel.findUnique({
        where: { id: parcelId },
        include: { delivery: true, sender: true },
      });

      if (!parcel) {
        throw new NotFoundException(`Parcel ${parcelId} not found`);
      }
      if (parcel.status === ParcelStatus.CANCELLED || parcel.status === ParcelStatus.DELIVERED) {
        throw new BadRequestException('Cannot assign a driver to this parcel');
      }
      if (parcel.delivery) {
        throw new BadRequestException('A driver is already assigned to this parcel');
      }

      const delivery = await this.createParcelDelivery(tx, parcelId, driver.id);
      return { delivery, parcel, driver };
    });

    await this.afterParcelAssigned(delivery, parcel, driver);
    return delivery;
  }

  private buildParcelAssignmentSms(parcel: {
    id: string;
    receiverName: string;
    receiverAddress: string;
    receiverPhone: string;
    weight: number;
    description?: string | null;
  }): string {
    const shortId = parcel.id.slice(0, 8).toUpperCase();
    const weight = parcel.weight > 0 ? `${parcel.weight} kg` : 'non renseigné';

    return [
      `Biso Express — Nouveau colis #${shortId}`,
      `Destinataire : ${parcel.receiverName}`,
      `Adresse : ${parcel.receiverAddress}`,
      `Tel : ${parcel.receiverPhone}`,
      `Poids : ${weight}`,
    ].join('\n');
  }

  async assign(orderId: string, driverId: string): Promise<Delivery> {
    const { delivery, order, driver } = await this.prisma.$transaction(async (tx) => {
      const driver = await this.assertDriverAssignable(tx, driverId);
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          delivery: true,
          user: true,
          restaurant: true,
          items: { include: { menuItem: true } },
        },
      });

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

      const delivery = await this.createOrderDelivery(tx, orderId, driver.id);
      return { delivery, order, driver };
    });

    await this.afterOrderAssigned(delivery, order, driver);
    return delivery;
  }

  private async createOrderDelivery(
    tx: TransactionClient,
    orderId: string,
    driverId: string,
  ) {
    await tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CONFIRMED },
    });

    return tx.delivery.create({
      data: {
        orderId,
        driverId,
        status: DeliveryStatus.ASSIGNED,
      },
      include: deliveryInclude,
    });
  }

  private async createParcelDelivery(
    tx: TransactionClient,
    parcelId: string,
    driverId: string,
  ) {
    return tx.delivery.create({
      data: {
        parcelId,
        driverId,
        status: DeliveryStatus.ASSIGNED,
      },
      include: deliveryInclude,
    });
  }

  private async assertDriverAssignable(
    tx: TransactionClient,
    driverId: string,
  ): Promise<User> {
    await tx.$queryRaw`
      SELECT dp.id
      FROM "DriverProfile" dp
      WHERE dp."userId" = ${driverId}
      FOR UPDATE
    `;

    const driver = await tx.user.findUnique({
      where: { id: driverId },
      include: { driverProfile: true },
    });

    if (!driver) {
      throw new NotFoundException(`Driver ${driverId} not found`);
    }
    if (driver.role !== UserRole.DRIVER) {
      throw new BadRequestException('The assigned user is not a driver');
    }
    if (!driver.driverProfile?.isAvailable) {
      throw new BadRequestException('This driver is not available');
    }

    const busy = await tx.delivery.findFirst({
      where: {
        driverId,
        status: { in: ACTIVE_DELIVERY_STATUSES },
      },
    });
    if (busy) {
      throw new BadRequestException('This driver is already on an active delivery');
    }

    return driver;
  }

  private async claimAvailableDriver(tx: TransactionClient): Promise<User | null> {
    const rows = await tx.$queryRaw<Array<{ userId: string }>>`
      SELECT dp."userId" as "userId"
      FROM "DriverProfile" dp
      INNER JOIN "User" u ON u.id = dp."userId"
      WHERE dp."isAvailable" = true
        AND u.role = CAST('DRIVER' AS "UserRole")
        AND NOT EXISTS (
          SELECT 1
          FROM "Delivery" d
          WHERE d."driverId" = dp."userId"
            AND d.status IN (
              CAST('ASSIGNED' AS "DeliveryStatus"),
              CAST('PICKED_UP' AS "DeliveryStatus"),
              CAST('IN_TRANSIT' AS "DeliveryStatus")
            )
        )
      ORDER BY dp."updatedAt" DESC
      LIMIT 1
      FOR UPDATE OF dp SKIP LOCKED
    `;

    if (!rows[0]?.userId) {
      return null;
    }

    return tx.user.findUnique({ where: { id: rows[0].userId } });
  }

  private async afterOrderAssigned(
    delivery: Delivery,
    order: {
      id: string;
      userId: string;
      grandTotal: number;
      deliveryAddress: string;
      deliveryCity: string;
      user?: { email?: string | null } | null;
      restaurant?: { name: string; latitude?: number | null; longitude?: number | null } | null;
      items: Array<{ quantity: number; menuItem?: { name: string } | null }>;
    },
    driver: User,
  ) {
    void this.notificationsService.notify(
      order.userId,
      NotificationType.DELIVERY_STATUS,
      'Livreur assigné',
      'Un livreur a été assigné à votre commande. Il arrive bientôt !',
      { orderId: order.id },
    );

    void this.notificationsService.notify(
      driver.id,
      NotificationType.DELIVERY_STATUS,
      'Nouvelle livraison',
      `Nouvelle course assignée — commande #${order.id.slice(0, 8).toUpperCase()}`,
      { orderId: order.id },
    );

    void this.trackingService.recordMilestone(
      delivery.id,
      DeliveryStatus.ASSIGNED,
      'Livreur assigné à la commande',
      order.restaurant?.latitude ?? undefined,
      order.restaurant?.longitude ?? undefined,
    );

    await this.prisma.driverLocation.upsert({
      where: { driverId: driver.id },
      update: { deliveryId: delivery.id },
      create: {
        driverId: driver.id,
        latitude: order.restaurant?.latitude ?? -4.2634,
        longitude: order.restaurant?.longitude ?? 15.2429,
        deliveryId: delivery.id,
      },
    });

    void this.mailService.sendNotification(
      order.user?.email ?? '',
      'DELIVERY',
      'Un livreur a été assigné',
      'Un livreur est en route pour récupérer votre commande.',
      { orderId: order.id },
    );

    void this.mailService.sendNotification(
      driver.email ?? '',
      'DELIVERY',
      'Nouvelle livraison assignée',
      `Une nouvelle livraison vous a été assignée pour la commande ${order.id}.`,
      { orderId: order.id },
    );

    void this.smsService.sendSms(
      driver.phone,
      this.buildDriverAssignmentSms(order),
    );
  }

  private async afterParcelAssigned(
    delivery: Delivery,
    parcel: {
      id: string;
      senderId: string;
      receiverName: string;
      receiverAddress: string;
      receiverPhone: string;
      weight: number;
      description?: string | null;
    },
    driver: User,
  ) {
    void this.notificationsService.notify(
      parcel.senderId,
      NotificationType.DELIVERY_STATUS,
      'Livreur assigné à votre colis',
      'Un livreur a été assigné à votre expédition colis.',
      { parcelId: parcel.id },
    );

    void this.notificationsService.notify(
      driver.id,
      NotificationType.DELIVERY_STATUS,
      'Nouvelle expédition colis',
      `Nouveau colis assigné — #${parcel.id.slice(0, 8).toUpperCase()}`,
      { parcelId: parcel.id },
    );

    void this.trackingService.recordMilestone(
      delivery.id,
      DeliveryStatus.ASSIGNED,
      'Livreur assigné au colis',
      -4.2634,
      15.2429,
    );

    await this.prisma.driverLocation.upsert({
      where: { driverId: driver.id },
      update: { deliveryId: delivery.id },
      create: {
        driverId: driver.id,
        latitude: -4.2634,
        longitude: 15.2429,
        deliveryId: delivery.id,
      },
    });

    void this.mailService.sendNotification(
      driver.email ?? '',
      'DELIVERY',
      'Nouveau colis assigné',
      `Une expédition colis vous a été assignée (#${parcel.id.slice(0, 8).toUpperCase()}).`,
      { parcelId: parcel.id },
    );

    void this.smsService.sendSms(driver.phone, this.buildParcelAssignmentSms(parcel));
  }

  private buildDriverAssignmentSms(order: {
    id: string;
    grandTotal: number;
    deliveryAddress: string;
    deliveryCity: string;
    restaurant?: { name: string } | null;
    items: Array<{ quantity: number; menuItem?: { name: string } | null }>;
  }): string {
    const shortId = order.id.slice(0, 8).toUpperCase();
    const restaurantName = order.restaurant?.name ?? 'Restaurant';
    const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const total = Math.round(order.grandTotal).toLocaleString('fr-FR');

    return [
      `Biso Express — Nouvelle livraison #${shortId}`,
      `${restaurantName} · ${total} FCFA`,
      `Livraison : ${order.deliveryAddress}, ${order.deliveryCity}`,
      `${itemCount} article${itemCount > 1 ? 's' : ''}`,
    ].join('\n');
  }

  findAll(pagination: PaginationArgs): Promise<PaginatedResult<Delivery>> {
    return paginate(
      (args) =>
        this.prisma.delivery.findMany({
          include: deliveryInclude,
          orderBy: { createdAt: 'desc' },
          skip: args.skip,
          take: args.take,
        }),
      () => this.prisma.delivery.count(),
      pagination,
    );
  }

  myDeliveries(
    driverId: string,
    pagination: PaginationArgs,
  ): Promise<PaginatedResult<Delivery>> {
    const where = { driverId };

    return paginate(
      (args) =>
        this.prisma.delivery.findMany({
          where,
          include: deliveryInclude,
          orderBy: { createdAt: 'desc' },
          skip: args.skip,
          take: args.take,
        }),
      () => this.prisma.delivery.count({ where }),
      pagination,
    );
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

    const updated = await this.prisma.$transaction(async (tx) => {
      if (delivery.orderId) {
        await tx.order.update({
          where: { id: delivery.orderId },
          data: { status: ORDER_STATUS_BY_DELIVERY[status] },
        });
      }

      const parcelStatus = PARCEL_STATUS_BY_DELIVERY[status];
      if (delivery.parcelId && parcelStatus) {
        await tx.parcel.update({
          where: { id: delivery.parcelId },
          data: {
            status: parcelStatus,
            deliveredAt: status === DeliveryStatus.DELIVERED ? new Date() : undefined,
          },
        });
      }

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

    const clientTitle =
      status === DeliveryStatus.DELIVERED
        ? 'Commande livrée'
        : 'Suivi de livraison';
    const clientMessage =
      status === DeliveryStatus.DELIVERED
        ? 'Votre commande a été livrée. Bon appétit !'
        : status === DeliveryStatus.IN_TRANSIT
          ? 'Votre commande est en route vers vous.'
          : status === DeliveryStatus.PICKED_UP
            ? 'Le livreur a récupéré votre commande.'
            : `Votre livraison est en cours (${status}).`;

    const notifyData: Record<string, string> = { deliveryStatus: status };
    if (delivery.orderId) notifyData.orderId = delivery.orderId;
    if (delivery.parcelId) notifyData.parcelId = delivery.parcelId;

    void this.notificationsService.notify(
      delivery.order?.userId ?? delivery.parcel?.senderId ?? '',
      NotificationType.DELIVERY_STATUS,
      clientTitle,
      clientMessage,
      notifyData,
    );

    const driverLoc = await this.prisma.driverLocation.findUnique({
      where: { driverId: delivery.driverId },
    });

    void this.trackingService.recordMilestone(
      delivery.id,
      status,
      clientMessage,
      driverLoc?.latitude,
      driverLoc?.longitude,
    );

    if (status === DeliveryStatus.DELIVERED) {
      await this.prisma.driverLocation.updateMany({
        where: { driverId: delivery.driverId },
        data: { deliveryId: null },
      });
    }

    const mailData: Record<string, string> = {};
    if (delivery.orderId) mailData.orderId = delivery.orderId;
    if (delivery.parcelId) mailData.parcelId = delivery.parcelId;

    void this.mailService.sendNotification(
      delivery.order?.user?.email ?? delivery.parcel?.sender?.email ?? '',
      'DELIVERY',
      status === DeliveryStatus.DELIVERED
        ? 'Commande livrée 🎉'
        : `Livraison ${status.toLowerCase().replace('_', ' ')}`,
      status === DeliveryStatus.DELIVERED
        ? 'Votre commande a été livrée. Bon appétit !'
        : `Votre livraison est maintenant : ${status}.`,
      mailData,
    );

    return updated;
  }

  remove(id: string): Promise<Delivery> {
    return this.prisma.delivery.delete({ where: { id } }).catch(() => {
      throw new NotFoundException(`Delivery ${id} not found`);
    });
  }
}
