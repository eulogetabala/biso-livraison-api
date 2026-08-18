import { createPaginatedType } from '../../../common/models/paginated.model';
import { NotificationModel } from './notification.model';

export const PaginatedNotificationModel =
  createPaginatedType(NotificationModel);
