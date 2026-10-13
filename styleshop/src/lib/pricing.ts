import type { CartItem, Product, ShippingMethod, ShippingMethodId } from '../types';

export const FREE_SHIPPING_THRESHOLD = 6000; // 60 €

export const SHIPPING_METHODS: ShippingMethod[] = [
  { id: 'standard', label: 'Livraison standard', delay: '3 à 5 jours ouvrés', price: 490 },
  { id: 'relais', label: 'Point relais', delay: '3 à 4 jours ouvrés', price: 350 },
  { id: 'express', label: 'Livraison express', delay: '24 à 48 h', price: 990 },
];

export interface PromoCode {
  code: string;
  label: string;
  kind: 'percent' | 'free_shipping';
  value: number;
}

/** Codes de démonstration. En production : validés côté serveur. */
export const PROMO_CODES: PromoCode[] = [
  { code: 'BIENVENUE10', label: '−10 % sur votre commande', kind: 'percent', value: 10 },
  { code: 'STYLE20', label: '−20 % sur votre commande', kind: 'percent', value: 20 },
  { code: 'LIVRAISON', label: 'Livraison offerte', kind: 'free_shipping', value: 0 },
];

export const findPromo = (code: string) =>
  PROMO_CODES.find((p) => p.code === code.trim().toUpperCase());

export interface Totals {
  itemCount: number;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  freeShippingRemaining: number;
}

/** Tous les montants sont en centimes (entiers) pour éviter les erreurs d'arrondi. */
export function computeTotals(
  items: CartItem[],
  products: Product[],
  shippingId: ShippingMethodId = 'standard',
  promoCode?: string,
): Totals {
  let subtotal = 0;
  let itemCount = 0;
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) continue;
    subtotal += product.price * item.quantity;
    itemCount += item.quantity;
  }

  const promo = promoCode ? findPromo(promoCode) : undefined;
  const discount = promo?.kind === 'percent' ? Math.round((subtotal * promo.value) / 100) : 0;
  const afterDiscount = subtotal - discount;

  const method = SHIPPING_METHODS.find((m) => m.id === shippingId) ?? SHIPPING_METHODS[0];
  const freeByThreshold = method.id === 'standard' && afterDiscount >= FREE_SHIPPING_THRESHOLD;
  const freeByPromo = promo?.kind === 'free_shipping';
  const shipping = itemCount === 0 || freeByThreshold || freeByPromo ? 0 : method.price;

  return {
    itemCount,
    subtotal,
    discount,
    shipping,
    total: afterDiscount + shipping,
    freeShippingRemaining: Math.max(0, FREE_SHIPPING_THRESHOLD - afterDiscount),
  };
}
