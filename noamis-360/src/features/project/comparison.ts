/**
 * Comparaison d'offres selon des critères pondérés.
 * Note pondérée sur 10 = Σ(note critère × poids) / Σ(poids). Fonction pure, testée.
 */
export type Criterion = { id: string; label: string; weight: number };
export type Offer = { id: string; vendor: string; amount_ht: number; delay_weeks: number | null; scores: Record<string, number> };

export type RankedOffer = Offer & { weighted: number; complete: boolean; rank: number; priceIndex: number };

export function weightedScore(offer: Pick<Offer, "scores">, criteria: Criterion[]): { value: number; complete: boolean } {
  const total = criteria.reduce((s, c) => s + c.weight, 0);
  if (!total) return { value: 0, complete: false };
  let sum = 0;
  let complete = true;
  for (const c of criteria) {
    const v = offer.scores[c.id];
    if (typeof v !== "number" || Number.isNaN(v)) {
      complete = false;
      continue;
    }
    sum += Math.min(10, Math.max(0, v)) * c.weight;
  }
  return { value: Math.round((sum / total) * 100) / 100, complete };
}

/** Note de prix suggérée (méthode proportionnelle : moins-disant = 10). */
export function suggestedPriceScore(amount: number, lowest: number): number {
  if (amount <= 0 || lowest <= 0) return 0;
  return Math.round((10 * lowest) / amount * 10) / 10;
}

export function rankOffers(offers: Offer[], criteria: Criterion[]): RankedOffer[] {
  const lowest = Math.min(...offers.map((o) => o.amount_ht).filter((a) => a > 0));
  const scored = offers.map((o) => {
    const { value, complete } = weightedScore(o, criteria);
    return { ...o, weighted: value, complete, rank: 0, priceIndex: Number.isFinite(lowest) ? suggestedPriceScore(o.amount_ht, lowest) : 0 };
  });
  const sorted = [...scored].sort((a, b) => b.weighted - a.weighted || a.amount_ht - b.amount_ht);
  sorted.forEach((o, i) => {
    o.rank = i > 0 && o.weighted === sorted[i - 1]!.weighted && o.amount_ht === sorted[i - 1]!.amount_ht ? sorted[i - 1]!.rank : i + 1;
  });
  return sorted;
}

export function totalWeight(criteria: Criterion[]): number {
  return criteria.reduce((s, c) => s + c.weight, 0);
}
