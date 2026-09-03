import { createPaginatedType } from '../../../common/models/paginated.model';
import { UserModel } from './user.model';

export const PaginatedUserModel = createPaginatedType(UserModel);
