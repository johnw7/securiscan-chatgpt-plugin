import type { OrderStatus } from '../types';

export const STATUS_LABELS: Record<OrderStatus, string> = {
  en_attente: 'En attente de paiement',
  payee: 'Payée',
  en_preparation: 'En préparation',
  expediee: 'Expédiée',
  livree: 'Livrée',
  annulee: 'Annulée',
};

export const STATUS_STYLES: Record<OrderStatus, string> = {
  en_attente: 'bg-amber-50 text-amber-900 ring-amber-200',
  payee: 'bg-green-50 text-green-900 ring-green-200',
  en_preparation: 'bg-sand-100 text-ink ring-sand-200',
  expediee: 'bg-blue-50 text-blue-900 ring-blue-200',
  livree: 'bg-mist-100 text-ink ring-mist-300',
  annulee: 'bg-red-50 text-red-900 ring-red-200',
};

export const STATUS_FLOW: OrderStatus[] = ['en_attente', 'payee', 'en_preparation', 'expediee', 'livree', 'annulee'];
