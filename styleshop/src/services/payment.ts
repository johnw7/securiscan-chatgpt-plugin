import { config, isStripeReady } from './config';
import type { Order } from '../types';

export type PaymentResult =
  | { mode: 'simule'; status: 'non_paye' }
  | { mode: 'stripe'; redirectUrl: string };

/**
 * Démarre le paiement d'une commande.
 *
 * - Sans prestataire connecté : renvoie un résultat SIMULÉ. Aucune somme n'est débitée et
 *   l'interface l'affiche clairement. La commande reste « en attente de paiement ».
 * - Avec Stripe : le serveur crée une session Stripe Checkout (prix recalculés côté serveur
 *   à partir des identifiants produits, jamais à partir des montants envoyés par le navigateur),
 *   puis on redirige vers la page de paiement hébergée par Stripe. Le statut « payée » n'est
 *   posé que par le webhook `checkout.session.completed` (voir server/stripe-checkout.ts).
 *   Aucune donnée bancaire ne transite ni n'est stockée chez nous.
 */
export async function startPayment(order: Order): Promise<PaymentResult> {
  if (!isStripeReady) return { mode: 'simule', status: 'non_paye' };

  const res = await fetch(`${config.apiUrl}/create-checkout-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: order.id,
      email: order.email,
      shippingMethod: order.shippingMethod,
      promoCode: order.promoCode,
      lines: order.lines.map((l) => ({ productId: l.productId, size: l.size, color: l.color, quantity: l.quantity })),
    }),
  });
  if (!res.ok) throw new Error('Impossible de créer la session de paiement.');
  const { url } = (await res.json()) as { url: string };
  return { mode: 'stripe', redirectUrl: url };
}
