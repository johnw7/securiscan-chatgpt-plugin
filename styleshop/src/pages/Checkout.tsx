import { Lock, ShoppingBag } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import DemoNotice from '../components/DemoNotice';
import ProductImage from '../components/ProductImage';
import { useStore } from '../context/StoreContext';
import { formatPrice } from '../lib/format';
import { computeTotals, SHIPPING_METHODS } from '../lib/pricing';
import { isStripeReady } from '../services/config';
import { orderNumber, uid } from '../services/ids';
import { startPayment } from '../services/payment';
import type { Order, ShippingMethodId } from '../types';

const COUNTRIES = ['France', 'Belgique', 'Suisse', 'Luxembourg', 'Monaco', 'Canada'];

type Form = { firstName: string; lastName: string; email: string; phone: string; street: string; postalCode: string; city: string; country: string };

function validate(f: Form) {
  const e: Partial<Record<keyof Form, string>> = {};
  if (!f.firstName.trim()) e.firstName = 'Prénom requis';
  if (!f.lastName.trim()) e.lastName = 'Nom requis';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Adresse e-mail invalide';
  if (f.phone.replace(/\D/g, '').length < 9) e.phone = 'Numéro de téléphone invalide';
  if (!f.street.trim()) e.street = 'Adresse requise';
  if (!/^[0-9A-Za-z -]{4,10}$/.test(f.postalCode.trim())) e.postalCode = 'Code postal invalide';
  if (!f.city.trim()) e.city = 'Ville requise';
  return e;
}

export default function Checkout() {
  const { cart, products, getProduct, promoCode, user, placeOrder, clearCart, setPromoCode } = useStore();
  const navigate = useNavigate();
  const addr = user?.addresses[0];
  const [form, setForm] = useState<Form>({
    firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', email: user?.email ?? '', phone: user?.phone ?? '',
    street: addr?.street ?? '', postalCode: addr?.postalCode ?? '', city: addr?.city ?? '', country: addr?.country ?? 'France',
  });
  const [shipping, setShipping] = useState<ShippingMethodId>('standard');
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [payError, setPayError] = useState('');

  if (!cart.length) return <Navigate to="/panier" replace />;
  const totals = computeTotals(cart, products, shipping, promoCode);

  const set = (k: keyof Form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.getElementById(`f-${Object.keys(errs)[0]}`)?.focus();
      return;
    }
    setSubmitting(true);
    setPayError('');
    const order: Order = {
      id: uid(),
      number: orderNumber(),
      createdAt: new Date().toISOString(),
      email: form.email.trim(),
      customer: { firstName: form.firstName.trim(), lastName: form.lastName.trim(), phone: form.phone.trim() },
      address: { street: form.street.trim(), postalCode: form.postalCode.trim(), city: form.city.trim(), country: form.country },
      shippingMethod: shipping,
      lines: cart.map((i) => {
        const p = getProduct(i.productId)!;
        return { productId: p.id, name: p.name, image: p.images[0], size: i.size, color: i.color, quantity: i.quantity, unitPrice: p.price };
      }),
      subtotal: totals.subtotal,
      discount: totals.discount,
      shipping: totals.shipping,
      total: totals.total,
      promoCode: promoCode || undefined,
      // Jamais « payée » ici : seul un webhook du prestataire peut confirmer un paiement.
      status: 'en_attente',
      paymentMode: isStripeReady ? 'stripe' : 'simule',
    };
    try {
      const result = await startPayment(order);
      placeOrder(order);
      clearCart();
      setPromoCode('');
      if (result.mode === 'stripe') window.location.assign(result.redirectUrl);
      else navigate(`/confirmation/${order.id}`, { replace: true });
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Une erreur est survenue.');
      setSubmitting(false);
    }
  };

  const Field = ({ k, label, type = 'text', auto, className = '' }: { k: keyof Form; label: string; type?: string; auto?: string; className?: string }) => (
    <label className={`field ${className}`}>
      {label}
      <input id={`f-${k}`} type={type} autoComplete={auto} value={form[k]} onChange={set(k)} aria-invalid={!!errors[k]} className={`input ${errors[k] ? 'border-red-600' : ''}`} />
      {errors[k] && <span className="text-xs text-red-700">{errors[k]}</span>}
    </label>
  );

  return (
    <div className="container-page pt-10">
      <Link to="/panier" className="text-sm text-mist-500 hover:underline">← Retour au panier</Link>
      <h1 className="mt-2 font-display text-4xl md:text-5xl">Finaliser ma commande</h1>
      {!user && (
        <p className="mt-2 text-sm text-mist-500">Déjà client ? <Link to="/connexion?retour=/commande" className="underline">Connectez-vous</Link> pour pré-remplir vos informations.</p>
      )}

      <form onSubmit={submit} noValidate className="mt-8 grid gap-10 lg:grid-cols-[1fr_420px]">
        <div className="flex flex-col gap-10">
          <section>
            <h2 className="label-caps mb-4">1. Vos coordonnées</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {Field({ k: 'firstName', label: 'Prénom', auto: 'given-name' })}
              {Field({ k: 'lastName', label: 'Nom', auto: 'family-name' })}
              {Field({ k: 'email', label: 'Adresse e-mail', type: 'email', auto: 'email' })}
              {Field({ k: 'phone', label: 'Téléphone', type: 'tel', auto: 'tel' })}
            </div>
          </section>

          <section>
            <h2 className="label-caps mb-4">2. Adresse de livraison</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {Field({ k: 'street', label: 'Adresse', auto: 'street-address', className: 'sm:col-span-3' })}
              {Field({ k: 'postalCode', label: 'Code postal', auto: 'postal-code' })}
              {Field({ k: 'city', label: 'Ville', auto: 'address-level2' })}
              <label className="field">
                Pays
                <select value={form.country} onChange={set('country')} className="input" autoComplete="country-name">
                  {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
            </div>
          </section>

          <fieldset>
            <legend className="label-caps mb-4">3. Mode de livraison</legend>
            <div className="grid gap-3">
              {SHIPPING_METHODS.map((m) => {
                const t = computeTotals(cart, products, m.id, promoCode);
                return (
                  <label key={m.id} className={`flex min-h-16 cursor-pointer items-center justify-between gap-4 rounded-2xl border px-5 py-4 transition ${shipping === m.id ? 'border-ink ring-1 ring-ink' : 'border-mist-300 hover:border-ink'}`}>
                    <span className="flex items-center gap-3">
                      <input type="radio" name="shipping" checked={shipping === m.id} onChange={() => setShipping(m.id)} className="h-4 w-4 accent-ink" />
                      <span><span className="block font-medium">{m.label}</span><span className="text-sm text-mist-500">{m.delay}</span></span>
                    </span>
                    <span className="font-semibold">{t.shipping ? formatPrice(t.shipping) : 'Offerte'}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <section>
            <h2 className="label-caps mb-4">4. Paiement</h2>
            <div className="card flex flex-col gap-4">
              <div className="flex items-center gap-2 text-sm font-medium"><Lock className="h-4 w-4" /> Paiement sécurisé</div>
              {isStripeReady ? (
                <p className="text-sm text-neutral-700">Vous allez être redirigé vers la page de paiement sécurisée Stripe. Aucune donnée bancaire n’est saisie ni stockée sur STYLESHOP.</p>
              ) : (
                <DemoNotice>
                  <strong>Paiement simulé — mode démonstration.</strong> Aucun prestataire de paiement n’est connecté : aucune carte n’est demandée et
                  aucune somme ne sera débitée. Votre commande sera enregistrée « en attente de paiement ».
                </DemoNotice>
              )}
              <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wider text-mist-500" aria-label="Moyens de paiement prévus">
                {['Visa', 'Mastercard', 'CB', 'Apple Pay', 'Google Pay'].map((m) => <span key={m} className="rounded-md border border-mist-300 px-2 py-1">{m}</span>)}
              </div>
            </div>
          </section>
        </div>

        <aside aria-label="Récapitulatif de la commande" className="h-fit rounded-3xl bg-sand-50 p-6 lg:sticky lg:top-36">
          <p className="flex items-center gap-2 font-display text-2xl"><ShoppingBag className="h-5 w-5" /> Votre commande</p>
          <ul className="mt-5 space-y-4">
            {cart.map((i) => {
              const p = getProduct(i.productId);
              if (!p) return null;
              return (
                <li key={`${i.productId}-${i.size}-${i.color}`} className="flex gap-3">
                  <div className="relative w-16 flex-none">
                    <ProductImage src={p.images[0]} alt={p.name} fallbackLabel="" className="aspect-[3/4] w-full rounded-lg" />
                    <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[11px] text-white">{i.quantity}</span>
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-mist-500">{i.size} · {i.color}</p>
                  </div>
                  <p className="text-sm font-semibold">{formatPrice(p.price * i.quantity)}</p>
                </li>
              );
            })}
          </ul>
          <dl className="mt-6 space-y-3 border-t border-sand-200 pt-5 text-sm">
            <div className="flex justify-between"><dt>Sous-total</dt><dd>{formatPrice(totals.subtotal)}</dd></div>
            {totals.discount > 0 && <div className="flex justify-between text-green-800"><dt>Réduction ({promoCode})</dt><dd>−{formatPrice(totals.discount)}</dd></div>}
            <div className="flex justify-between"><dt>Livraison</dt><dd>{totals.shipping ? formatPrice(totals.shipping) : 'Offerte'}</dd></div>
            <div className="flex justify-between border-t border-sand-200 pt-4 text-lg font-semibold"><dt>Total TTC</dt><dd>{formatPrice(totals.total)}</dd></div>
          </dl>
          {payError && <p className="mt-4 text-sm text-red-700" role="alert">{payError}</p>}
          <button type="submit" disabled={submitting} className="btn-primary mt-6 w-full">
            {submitting ? 'Traitement…' : isStripeReady ? `Payer ${formatPrice(totals.total)}` : 'Valider la commande (paiement simulé)'}
          </button>
          <p className="mt-3 text-center text-xs text-mist-500">En validant, vous acceptez les conditions générales de vente (démo).</p>
        </aside>
      </form>
    </div>
  );
}
