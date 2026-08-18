import { createPaginatedType } from '../../../common/models/paginated.model';
import { ParcelModel } from './parcel.model';

export const PaginatedParcelModel = createPaginatedType(ParcelModel);
