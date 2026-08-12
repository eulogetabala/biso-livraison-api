import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  NotificationType,
  OrderStatus,
  PaymentStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MailService } from '../mail/mail.service';

const paymentInclude = {
  order: {
    include: {
      delivery: true,
      user: true,
    },
  },
} as const;

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  findAll() {
    return this.prisma.payment.findMany({
      include: paymentInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByOrder(orderId: string, currentUser: CurrentUser) {
    const payment = await this.prisma.payment.findUnique({
      where: { orderId },
      include: paymentInclude,
    });

    if (!payment) {
      throw new NotFoundException(`No payment for order ${orderId}`);
    }

    const isOwner = payment.order.userId === currentUser.id;
    if (!isOwner && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You cannot access this payment');
    }

    return payment;
  }

  async markPaid(orderId: string, currentUser: CurrentUser) {
    const payment = await this.prisma.payment.findUnique({
      where: { orderId },
      include: paymentInclude,
    });

    if (!payment) {
      throw new NotFoundException(`No payment for order ${orderId}`);
    }

    if (payment.status === PaymentStatus.PAID) {
      throw new BadRequestException('Payment has already been collected');
    }

    if (payment.status === PaymentStatus.CANCELLED) {
      throw new BadRequestException('A cancelled payment cannot be collected');
    }

    if (payment.order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException(
        'Cash on delivery can only be collected once the order is delivered',
      );
    }

    const isAdmin = currentUser.role === UserRole.ADMIN;
    const isAssignedDriver =
      payment.order.delivery?.driverId === currentUser.id;

    if (!isAdmin && !isAssignedDriver) {
      throw new ForbiddenException(
        'Only the assigned driver or an admin can collect the payment',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const paid = await tx.payment.update({
        where: { orderId },
        data: {
          status: PaymentStatus.PAID,
          paidAt: new Date(),
        },
        include: paymentInclude,
      });

      await tx.notification.create({
        data: {
          userId: payment.order.userId,
          type: NotificationType.PAYMENT,
          title: 'Paiement encaissé',
          message: `Paiement de ${paid.amount.toFixed(2)} € encaissé à la livraison. Merci !`,
        },
      });

      return paid;
    });

    void this.mailService.sendNotification(
      payment.order.user?.email ?? '',
      'PAYMENT',
      'Paiement encaissé',
      `Le paiement de ${updated.amount.toFixed(2)} € a bien été encaissé à la livraison. Merci pour votre confiance !`,
      { orderId, amount: updated.amount },
    );

    return updated;
  }
}
