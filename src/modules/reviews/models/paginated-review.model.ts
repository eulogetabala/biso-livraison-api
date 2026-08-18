import { createPaginatedType } from '../../../common/models/paginated.model';
import { ReviewModel } from './review.model';

export const PaginatedReviewModel = createPaginatedType(ReviewModel);
