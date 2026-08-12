import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DeliveryStatus,
  Order,
  OrderStatus,
  NotificationType,
  PaymentMethod,
  PaymentStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateOrderInput,
  CreateOrderItemInput,
} from './dto/create-order.input';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MailService } from '../mail/mail.service';

const orderInclude = {
  items: { include: { menuItem: true } },
  user: true,
  restaurant: true,
  payment: true,
  delivery: { include: { driver: true } },
} as const;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async create(input: CreateOrderInput, userId: string): Promise<Order> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: input.restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant ${input.restaurantId} not found`);
    }

    if (!restaurant.isActive) {
      throw new BadRequestException('This restaurant is currently closed');
    }

    const { menuItems, totals } = await this.resolveItems(
      input.restaurantId,
      input.items,
    );

    const deliveryFee = restaurant.deliveryFee ?? 0;
    const grandTotal = totals.total + deliveryFee;

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId,
          restaurantId: input.restaurantId,
          total: totals.total,
          deliveryAddress: input.deliveryAddress,
          deliveryCity: input.deliveryCity,
          deliveryZipCode: input.deliveryZipCode,
          deliveryFee,
          grandTotal,
          items: {
            create: menuItems.map((item) => ({
              menuItemId: item.id,
              quantity: totals.quantities.get(item.id) ?? 1,
              unitPrice: item.price,
            })),
          },
        },
        include: orderInclude,
      });

      await tx.payment.create({
        data: {
          orderId: created.id,
          method: input.paymentMethod ?? PaymentMethod.CASH_ON_DELIVERY,
          amount: created.grandTotal,
        },
      });

      return tx.order.findUniqueOrThrow({
        where: { id: created.id },
        include: orderInclude,
      });
    });

    void this.mailService.sendNotification(
      order.user?.email ?? '',
      'ORDER',
      'Commande confirmée',
      `Votre commande chez ${order.restaurant?.name ?? 'le restaurant'} est bien reçue. ` +
        `Montant total : ${order.grandTotal.toFixed(2)} € (paiement à la livraison).`,
      { orderId: order.id, amount: order.grandTotal },
    );

    return order;
  }

  findAll(): Promise<Order[]> {
    return this.prisma.order.findMany({
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  findByUser(userId: string): Promise<Order[]> {
    return this.prisma.order.findMany({
      where: { userId },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, currentUser: CurrentUser): Promise<Order> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });

    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    // A user may only read their own order; admins can read any order.
    if (
      order.userId !== currentUser.id &&
      currentUser.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('You cannot access this order');
    }

    return order;
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const existing = await this.prisma.order.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existing) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    if (existing.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('A cancelled order cannot be updated');
    }

    const order = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: { status },
        include: orderInclude,
      });

      if (status === OrderStatus.CANCELLED) {
        await tx.payment.updateMany({
          where: { orderId: id, status: PaymentStatus.PENDING },
          data: { status: PaymentStatus.CANCELLED },
        });

        return tx.order.findUniqueOrThrow({
          where: { id },
          include: orderInclude,
        });
      }

      await tx.notification.create({
        data: {
          userId: existing.userId,
          type: NotificationType.ORDER_STATUS,
          title: 'Statut de votre commande',
          message: `Votre commande est passée au statut ${status}`,
        },
      });

      return updated;
    });

    if (status === OrderStatus.CANCELLED) {
      void this.mailService.sendNotification(
        existing.user?.email ?? '',
        'ORDER',
        'Commande annulée',
        'Votre commande a été annulée. Aucun montant n’a été encaissé.',
        { orderId: id },
      );
    } else {
      void this.mailService.sendNotification(
        existing.user?.email ?? '',
        'ORDER',
        `Commande ${status.toLowerCase()}`,
        `Votre commande est passée au statut : ${status}.`,
        { orderId: id },
      );
    }

    return order;
  }

  async cancelByClient(id: string, currentUser: CurrentUser): Promise<Order> {
    const existing = await this.prisma.order.findUnique({
      where: { id },
      include: { delivery: true, user: true },
    });

    if (!existing) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    if (
      existing.userId !== currentUser.id &&
      currentUser.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('You cannot cancel this order');
    }

    if (existing.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('This order is already cancelled');
    }

    const deliveryStarted =
      existing.delivery && existing.delivery.status !== DeliveryStatus.ASSIGNED;

    const CANCELLABLE_STATUSES: OrderStatus[] = [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
    ];

    const canCancel =
      CANCELLABLE_STATUSES.includes(existing.status) && !deliveryStarted;

    if (!canCancel) {
      const reason =
        existing.status === OrderStatus.DELIVERED
          ? 'This order has already been delivered'
          : 'This order can no longer be cancelled: the delivery is in progress';
      throw new BadRequestException(reason);
    }

    const order = await this.prisma.$transaction(async (tx) => {
      await tx.payment.updateMany({
        where: { orderId: id, status: PaymentStatus.PENDING },
        data: { status: PaymentStatus.CANCELLED },
      });

      await tx.notification.create({
        data: {
          userId: existing.userId,
          type: NotificationType.ORDER_STATUS,
          title: 'Commande annulée',
          message: 'Votre commande a été annulée',
        },
      });

      return tx.order.update({
        where: { id },
        data: { status: OrderStatus.CANCELLED },
        include: orderInclude,
      });
    });

    void this.mailService.sendNotification(
      existing.user?.email ?? '',
      'ORDER',
      'Commande annulée',
      'Votre commande a été annulée. Aucun montant n’a été encaissé.',
      { orderId: id },
    );

    return order;
  }

  remove(id: string): Promise<Order> {
    return this.prisma.order.delete({ where: { id } }).catch(() => {
      throw new NotFoundException(`Order ${id} not found`);
    });
  }

  private async resolveItems(
    restaurantId: string,
    items: CreateOrderItemInput[],
  ) {
    const itemIds = items.map((item) => item.menuItemId);
    const quantities = new Map(
      items.map((item) => [item.menuItemId, item.quantity]),
    );

    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: itemIds } },
    });

    if (menuItems.length !== itemIds.length) {
      throw new BadRequestException('One or more menu items do not exist');
    }

    const itemsOutsideRestaurant = menuItems.some(
      (item) => item.restaurantId !== restaurantId,
    );
    if (itemsOutsideRestaurant) {
      throw new BadRequestException(
        'One or more items do not belong to this restaurant',
      );
    }

    const unavailableItems = menuItems.filter((item) => !item.isAvailable);
    if (unavailableItems.length > 0) {
      throw new BadRequestException(
        `Item(s) unavailable: ${unavailableItems.map((i) => i.name).join(', ')}`,
      );
    }

    const total = menuItems.reduce(
      (sum, item) => sum + item.price * (quantities.get(item.id) ?? 1),
      0,
    );

    return { menuItems, totals: { total, quantities } };
  }
}
