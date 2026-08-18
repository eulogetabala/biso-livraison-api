import { createPaginatedType } from '../../../common/models/paginated.model';
import { DeliveryModel } from './delivery.model';

export const PaginatedDeliveryModel = createPaginatedType(DeliveryModel);
