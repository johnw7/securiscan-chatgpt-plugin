import { describe, expect, it } from 'vitest';
import { computeTotals } from './pricing';
import type { Product } from '../types';

const p = (id: string, price: number) => ({ id, price }) as Product;
const products = [p('a', 1999), p('b', 4999)];

describe('computeTotals', () => {
  it('panier vide : tout à zéro, pas de frais de port', () => {
    expect(computeTotals([], products)).toMatchObject({ subtotal: 0, shipping: 0, total: 0 });
  });

  it('calcule sous-total, livraison standard et total', () => {
    const t = computeTotals([{ productId: 'a', size: 'M', color: 'Noir', quantity: 2 }], products);
    expect(t.subtotal).toBe(3998);
    expect(t.shipping).toBe(490);
    expect(t.total).toBe(4488);
    expect(t.itemCount).toBe(2);
  });

  it('livraison standard offerte dès 60 € après remise', () => {
    const items = [{ productId: 'b', size: 'M' as const, color: 'Noir', quantity: 2 }];
    expect(computeTotals(items, products).shipping).toBe(0);
    expect(computeTotals(items, products, 'express').shipping).toBe(990);
  });

  it('applique BIENVENUE10 (−10 %) puis réévalue le seuil de gratuité', () => {
    const items = [{ productId: 'a', size: 'M' as const, color: 'Noir', quantity: 3 }]; // 59,97 €
    const t = computeTotals(items, products, 'standard', 'bienvenue10');
    expect(t.discount).toBe(600);
    expect(t.shipping).toBe(490);
    expect(t.total).toBe(5997 - 600 + 490);
  });

  it('LIVRAISON offre les frais de port, code inconnu ignoré', () => {
    const items = [{ productId: 'a', size: 'M' as const, color: 'Noir', quantity: 1 }];
    expect(computeTotals(items, products, 'express', 'LIVRAISON').shipping).toBe(0);
    expect(computeTotals(items, products, 'standard', 'FAUX').discount).toBe(0);
  });
});
