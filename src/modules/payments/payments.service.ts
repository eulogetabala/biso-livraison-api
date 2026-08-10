import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, PaymentStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

const paymentInclude = {
  order: {
    include: {
      delivery: true,
    },
  },
} as const;

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.payment.update({
      where: { orderId },
      data: {
        status: PaymentStatus.PAID,
        paidAt: new Date(),
      },
      include: paymentInclude,
    });
  }
}
