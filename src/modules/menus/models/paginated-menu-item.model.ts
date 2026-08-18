import { createPaginatedType } from '../../../common/models/paginated.model';
import { MenuItemModel } from './menu-item.model';

export const PaginatedMenuItemModel = createPaginatedType(MenuItemModel);
