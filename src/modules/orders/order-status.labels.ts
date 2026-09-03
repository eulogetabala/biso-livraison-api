import { OrderStatus } from '@prisma/client';

export const ORDER_STATUS_LABELS_FR: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'En attente',
  [OrderStatus.CONFIRMED]: 'Confirmée',
  [OrderStatus.PREPARING]: 'En préparation',
  [OrderStatus.IN_TRANSIT]: 'En livraison',
  [OrderStatus.DELIVERED]: 'Livrée',
  [OrderStatus.CANCELLED]: 'Annulée',
};
