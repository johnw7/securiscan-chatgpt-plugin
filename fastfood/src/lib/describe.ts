import { EXTRAS } from '../data/menu';
import type { LineOptions } from '../types';

/** Résumé lisible des options d'une ligne de panier. */
export function describe(o: LineOptions): string[] {
  const out: string[] = [];
  if (o.menu) out.push(`En menu : ${o.menu.side} + ${o.menu.drink.replace(' (+0,50 €)', '')}`);
  if (o.size === 'xl') out.push('Taille XL');
  if (o.sauce) out.push(`Sauce ${o.sauce.toLowerCase()}`);
  for (const id of o.extras) { const e = EXTRAS.find((x) => x.id === id); if (e) out.push(`+ ${e.label}`); }
  if (o.removed.length) out.push(`Sans ${o.removed.map((r) => r.toLowerCase()).join(', ')}`);
  if (o.note) out.push(`« ${o.note} »`);
  return out;
}
