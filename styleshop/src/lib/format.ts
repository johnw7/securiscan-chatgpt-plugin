const eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

/** Formate un montant en centimes : 4999 → « 49,99 € ». */
export const formatPrice = (cents: number) => eur.format(cents / 100);

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

export const discountPercent = (price: number, compareAt?: number) =>
  compareAt && compareAt > price ? Math.round((1 - price / compareAt) * 100) : 0;

export const averageRating = (ratings: number[]) =>
  ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : 0;
