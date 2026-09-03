import { Injectable, NotFoundException } from '@nestjs/common';
import { Notification, NotificationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationArgs } from '../../common/dto/pagination.args';
import { paginate, PaginatedResult } from '../../common/utils/pagination.util';
import { PushService } from './push.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pushService: PushService,
  ) {}

  async notify(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, string>,
  ): Promise<Notification> {
    const notification = await this.prisma.notification.create({
      data: { userId, type, title, message },
    });

    void this.pushService.sendToUser(userId, {
      title,
      body: message,
      data: { type, ...data },
    });

    return notification;
  }

  myNotifications(
    userId: string,
    pagination: PaginationArgs,
  ): Promise<PaginatedResult<Notification>> {
    const where = { userId };

    return paginate(
      (args) =>
        this.prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: args.skip,
          take: args.take,
        }),
      () => this.prisma.notification.count({ where }),
      pagination,
    );
  }

  unreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, readAt: null },
    });
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    return this.prisma.notification
      .update({
        where: { id, userId },
        data: { readAt: new Date() },
      })
      .catch(() => {
        throw new NotFoundException(`Notification ${id} not found`);
      });
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return result.count;
  }
}
