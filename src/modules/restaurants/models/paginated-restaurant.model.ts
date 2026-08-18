import { createPaginatedType } from '../../../common/models/paginated.model';
import { RestaurantModel } from './restaurant.model';

export const PaginatedRestaurantModel = createPaginatedType(RestaurantModel);
