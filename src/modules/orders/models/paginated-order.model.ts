import { createPaginatedType } from '../../../common/models/paginated.model';
import { OrderModel } from './order.model';

export const PaginatedOrderModel = createPaginatedType(OrderModel);
