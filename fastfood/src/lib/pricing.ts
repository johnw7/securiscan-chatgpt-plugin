import { EXTRAS, MENU_SUPPLEMENT, XL_SUPPLEMENT } from '../data/menu';
import type { CartLine, LineOptions, Mode, Product } from '../types';

export const DELIVERY_FEE = 290;
export const FREE_DELIVERY_FROM = 2500;
export const MIN_DELIVERY_ORDER = 1500;
export const LEMONADE_IN_MENU = 50;

export interface Promo { code: string; label: string; kind: 'percent' | 'free_delivery'; value: number; min?: number }

/** Codes de démonstration. En production : validés côté serveur. */
export const PROMOS: Promo[] = [
  { code: 'SMASH10', label: '−10 % sur la commande', kind: 'percent', value: 10 },
  { code: 'BIGFAIM', label: '−20 % dès 30 € d’achat', kind: 'percent', value: 20, min: 3000 },
  { code: 'LIVRAISON', label: 'Livraison offerte', kind: 'free_delivery', value: 0 },
];

export const findPromo = (code: string) => PROMOS.find((p) => p.code === code.trim().toUpperCase());

/** Prix unitaire d'un article avec ses options (centimes). */
export function unitPrice(product: Product, o: LineOptions): number {
  let p = product.price;
  if (o.menu) {
    p += MENU_SUPPLEMENT;
    if (o.menu.drink.startsWith('Limonade')) p += LEMONADE_IN_MENU;
  }
  if (o.size === 'xl') p += XL_SUPPLEMENT;
  for (const id of o.extras) p += EXTRAS.find((e) => e.id === id)?.price ?? 0;
  return p;
}

export interface Totals {
  count: number;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  /** Montant manquant pour atteindre le minimum de commande en livraison. */
  missingForMin: number;
  missingForFreeDelivery: number;
  promoError?: string;
}

export function computeTotals(lines: CartLine[], mode: Mode, promoCode?: string): Totals {
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const count = lines.reduce((s, l) => s + l.quantity, 0);
  const promo = promoCode ? findPromo(promoCode) : undefined;
  let promoError: string | undefined;
  let discount = 0;
  if (promo?.kind === 'percent') {
    if (promo.min && subtotal < promo.min) promoError = `Ce code s’applique dès ${(promo.min / 100).toFixed(0)} € d’achat.`;
    else discount = Math.round((subtotal * promo.value) / 100);
  }
  const afterDiscount = subtotal - discount;
  const delivery = mode === 'livraison';
  const freeDelivery = afterDiscount >= FREE_DELIVERY_FROM || promo?.kind === 'free_delivery';
  const deliveryFee = delivery && count > 0 && !freeDelivery ? DELIVERY_FEE : 0;
  return {
    count,
    subtotal,
    discount,
    deliveryFee,
    total: afterDiscount + deliveryFee,
    missingForMin: delivery ? Math.max(0, MIN_DELIVERY_ORDER - afterDiscount) : 0,
    missingForFreeDelivery: delivery ? Math.max(0, FREE_DELIVERY_FROM - afterDiscount) : 0,
    promoError,
  };
}
