/**
 * STYLESHOP — API de paiement Stripe Checkout (exemple prêt à adapter, NON utilisé en mode démo).
 *
 * Déploiement possible : Supabase Edge Function, Vercel/Netlify Function, ou petit serveur Express.
 * Dépendances : npm i express stripe @supabase/supabase-js
 * Variables d'environnement SERVEUR (jamais dans le front) :
 *   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PUBLIC_SITE_URL
 *
 * Principes de sécurité :
 *  1. Les prix sont relus en base à partir des identifiants produits : on ignore tout montant envoyé par le navigateur.
 *  2. Le paiement est saisi sur la page hébergée par Stripe : aucune donnée bancaire ne passe par nos serveurs.
 *  3. La commande ne passe à « payee » QUE dans le webhook signé `checkout.session.completed`.
 */
import express from 'express';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const app = express();

const SHIPPING: Record<string, { label: string; price: number }> = {
  standard: { label: 'Livraison standard', price: 490 },
  relais: { label: 'Point relais', price: 350 },
  express: { label: 'Livraison express', price: 990 },
};

// Le webhook a besoin du corps brut pour vérifier la signature : on le déclare AVANT express.json().
app.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'] as string, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return res.status(400).send('Signature invalide');
  }
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status === 'paid') {
      await db.from('orders').update({ status: 'payee' }).eq('stripe_session_id', session.id).eq('status', 'en_attente');
      // Ici : décrémenter le stock, envoyer l'e-mail de confirmation…
    }
  }
  res.json({ received: true });
});

app.use(express.json());

app.post('/create-checkout-session', async (req, res) => {
  const { orderId, email, shippingMethod, lines } = req.body as {
    orderId: string; email: string; shippingMethod: string;
    lines: { productId: string; size: string; color: string; quantity: number }[];
  };
  if (!Array.isArray(lines) || !lines.length || !SHIPPING[shippingMethod]) return res.status(400).json({ error: 'Requête invalide' });

  const { data: products, error } = await db.from('products').select('id,name,price,stock,images').in('id', lines.map((l) => l.productId));
  if (error || !products) return res.status(500).json({ error: 'Catalogue indisponible' });

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  for (const l of lines) {
    const p = products.find((x) => x.id === l.productId);
    const qty = Math.floor(Number(l.quantity));
    if (!p || qty < 1 || qty > p.stock) return res.status(409).json({ error: `Stock insuffisant ou article inconnu : ${l.productId}` });
    lineItems.push({
      quantity: qty,
      price_data: { currency: 'eur', unit_amount: p.price, product_data: { name: `${p.name} — ${l.size} / ${l.color}`, images: p.images.slice(0, 1) } },
    });
  }
  // Codes promo : créer des coupons Stripe et utiliser `discounts` ou `allow_promotion_codes: true`.

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: email,
    line_items: lineItems,
    shipping_options: [{ shipping_rate_data: { type: 'fixed_amount', display_name: SHIPPING[shippingMethod].label, fixed_amount: { amount: SHIPPING[shippingMethod].price, currency: 'eur' } } }],
    success_url: `${process.env.PUBLIC_SITE_URL}/confirmation/${orderId}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.PUBLIC_SITE_URL}/panier`,
    metadata: { orderId },
  });

  await db.from('orders').update({ stripe_session_id: session.id }).eq('id', orderId);
  res.json({ url: session.url });
});

app.listen(Number(process.env.PORT ?? 8787), () => console.log('API STYLESHOP prête'));
