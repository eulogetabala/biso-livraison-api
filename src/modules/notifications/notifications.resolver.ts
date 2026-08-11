import { UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { NotificationsService } from './notifications.service';
import { NotificationModel } from './models/notification.model';
import { MarkNotificationReadInput } from './dto/mark-notification-read.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => NotificationModel)
export class NotificationsResolver {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Query(() => [NotificationModel])
  @UseGuards(JwtAuthGuard)
  myNotifications(@CurrentUser() user: CurrentUser) {
    return this.notificationsService.myNotifications(user.id);
  }

  @Query(() => Int)
  @UseGuards(JwtAuthGuard)
  unreadNotificationsCount(@CurrentUser() user: CurrentUser) {
    return this.notificationsService.unreadCount(user.id);
  }

  @Mutation(() => NotificationModel)
  @UseGuards(JwtAuthGuard)
  markNotificationAsRead(
    @Args('input') input: MarkNotificationReadInput,
    @CurrentUser() user: CurrentUser,
  ) {
    return this.notificationsService.markAsRead(input.id, user.id);
  }

  @Mutation(() => Int)
  @UseGuards(JwtAuthGuard)
  markAllNotificationsAsRead(@CurrentUser() user: CurrentUser) {
    return this.notificationsService.markAllAsRead(user.id);
  }
}
