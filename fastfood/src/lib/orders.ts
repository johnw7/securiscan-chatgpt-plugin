import type { Mode, OrderStatus } from '../types';

export const MODE_LABELS: Record<Mode, string> = { livraison: 'Livraison', emporter: 'À emporter', surplace: 'Sur place' };

export const STATUS_LABELS: Record<OrderStatus, string> = {
  recue: 'Commande reçue',
  preparation: 'En préparation',
  prete: 'Prête',
  livraison: 'En livraison',
  terminee: 'Terminée',
  annulee: 'Annulée',
};

export const STATUS_STYLES: Record<OrderStatus, string> = {
  recue: 'bg-sky-100 text-sky-900',
  preparation: 'bg-amber-100 text-amber-900',
  prete: 'bg-emerald-100 text-emerald-900',
  livraison: 'bg-violet-100 text-violet-900',
  terminee: 'bg-stone-200 text-stone-800',
  annulee: 'bg-red-100 text-red-900',
};

/** Étapes affichées au client selon le mode. */
export const stepsFor = (mode: Mode): OrderStatus[] =>
  mode === 'livraison' ? ['recue', 'preparation', 'livraison', 'terminee'] : ['recue', 'preparation', 'prete', 'terminee'];

/** Créneaux de retrait / livraison de démonstration (toutes les 15 min sur 2 h). */
export function timeSlots(now = new Date()): string[] {
  const out = ['Dès que possible (20–30 min)'];
  const d = new Date(now);
  d.setMinutes(Math.ceil((d.getMinutes() + 30) / 15) * 15, 0, 0);
  for (let i = 0; i < 8; i++) {
    out.push(d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    d.setMinutes(d.getMinutes() + 15);
  }
  return out;
}
