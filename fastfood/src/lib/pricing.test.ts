import { describe, expect, it } from 'vitest';
import { computeTotals, unitPrice } from './pricing';
import type { CartLine, Product } from '../types';

const burger = { id: 'b', price: 890 } as Product;
const line = (unit: number, quantity = 1): CartLine => ({ key: String(unit), productId: 'b', quantity, unitPrice: unit, options: { extras: [], removed: [] } });

describe('unitPrice', () => {
  it('ajoute formule menu, limonade, taille XL et suppléments', () => {
    expect(unitPrice(burger, { extras: [], removed: [] })).toBe(890);
    expect(unitPrice(burger, { extras: ['bacon', 'cheddar'], removed: [] })).toBe(890 + 120 + 80);
    expect(unitPrice(burger, { menu: { side: 'Frites maison', drink: 'Soda cola' }, extras: [], removed: [] })).toBe(1240);
    expect(unitPrice(burger, { menu: { side: 'Frites maison', drink: 'Limonade maison (+0,50 €)' }, extras: [], removed: [] })).toBe(1290);
    expect(unitPrice(burger, { size: 'xl', extras: [], removed: [] })).toBe(1040);
  });
});

describe('computeTotals', () => {
  it('livraison 2,90 € et minimum de commande 15 €', () => {
    const t = computeTotals([line(890)], 'livraison');
    expect(t.deliveryFee).toBe(290);
    expect(t.total).toBe(1180);
    expect(t.missingForMin).toBe(610);
  });
  it('livraison offerte dès 25 €, pas de frais à emporter', () => {
    expect(computeTotals([line(1290, 2)], 'livraison').deliveryFee).toBe(0);
    expect(computeTotals([line(890)], 'emporter')).toMatchObject({ deliveryFee: 0, total: 890, missingForMin: 0 });
  });
  it('SMASH10 −10 %, BIGFAIM seulement dès 30 €, LIVRAISON offre les frais', () => {
    expect(computeTotals([line(2000)], 'emporter', 'smash10').discount).toBe(200);
    const small = computeTotals([line(2000)], 'emporter', 'BIGFAIM');
    expect(small.discount).toBe(0);
    expect(small.promoError).toBeTruthy();
    expect(computeTotals([line(3000)], 'emporter', 'BIGFAIM').discount).toBe(600);
    expect(computeTotals([line(1600)], 'livraison', 'LIVRAISON').deliveryFee).toBe(0);
  });
});
