import { PaginationArgs } from '../dto/pagination.args';
import { PageInfo } from '../models/page-info.model';

export interface PaginatedResult<T> {
  items: T[];
  pageInfo: PageInfo;
}

export function buildPageInfo(
  totalItems: number,
  pagination: PaginationArgs,
): PageInfo {
  const { page, limit } = pagination;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));

  return {
    totalItems,
    totalPages,
    currentPage: page,
    limit,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * Retourne la liste paginée d'items avec les métadonnées de pagination.
 */
export async function paginate<T>(
  findMany: (args: { skip: number; take: number }) => Promise<T[]>,
  count: () => Promise<number>,
  pagination: PaginationArgs,
): Promise<PaginatedResult<T>> {
  const skip = (pagination.page - 1) * pagination.limit;
  const take = pagination.limit;

  const [items, totalItems] = await Promise.all([
    findMany({ skip, take }),
    count(),
  ]);

  return {
    items,
    pageInfo: buildPageInfo(totalItems, pagination),
  };
}
