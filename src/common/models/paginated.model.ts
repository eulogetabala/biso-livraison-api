import { Type } from '@nestjs/common';
import { Field, ObjectType } from '@nestjs/graphql';
import { PageInfo } from './page-info.model';

export interface Paginated<T> {
  items: T[];
  pageInfo: PageInfo;
}

/**
 * Crée un type GraphQL paginé concret pour un modèle donné.
 * Chaque modèle doit être paginé UNE seule fois (nom de type unique).
 */
export function createPaginatedType<T>(classRef: Type<T>): Type<Paginated<T>> {
  @ObjectType(`Paginated${classRef.name}`)
  abstract class PaginatedType implements Paginated<T> {
    @Field(() => [classRef])
    items: T[];

    @Field(() => PageInfo)
    pageInfo: PageInfo;
  }

  return PaginatedType as Type<Paginated<T>>;
}
