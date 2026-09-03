import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../modules/auth/decorators/current-user.decorator';

export function isAdmin(user: CurrentUser): boolean {
  return user.role === UserRole.ADMIN;
}

export function isPartner(user: CurrentUser): boolean {
  return user.role === UserRole.PARTNER;
}

export function requirePartnerRestaurantId(user: CurrentUser): string {
  if (!isPartner(user)) {
    throw new ForbiddenException('Partner restaurant not configured');
  }
  if (!user.partnerRestaurantId) {
    throw new ForbiddenException(
      'Partner account is not linked to a restaurant',
    );
  }
  return user.partnerRestaurantId;
}

/** Vérifie qu’un PARTNER n’accède qu’à son restaurant ; ADMIN passe toujours. */
export function assertRestaurantAccess(
  user: CurrentUser,
  restaurantId: string | null | undefined,
): void {
  if (isAdmin(user)) {
    return;
  }
  if (!isPartner(user)) {
    throw new ForbiddenException('You cannot access this restaurant');
  }
  const partnerRestaurantId = requirePartnerRestaurantId(user);
  if (!restaurantId || restaurantId !== partnerRestaurantId) {
    throw new ForbiddenException('You cannot access this restaurant');
  }
}

/** Filtre Prisma pour limiter les commandes d’un PARTNER à son restaurant. */
export function partnerOrderRestaurantFilter(
  user: CurrentUser,
): { restaurantId: string } | undefined {
  if (!isPartner(user)) {
    return undefined;
  }
  return { restaurantId: requirePartnerRestaurantId(user) };
}
