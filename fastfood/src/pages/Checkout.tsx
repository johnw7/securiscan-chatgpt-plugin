import { CreditCard, Lock, Store, Tag } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import DemoNotice from '../components/DemoNotice';
import ModeSwitch from '../components/ModeSwitch';
import { useStore } from '../context/StoreContext';
import { describe } from '../lib/describe';
import { formatPrice } from '../lib/format';
import { MODE_LABELS, timeSlots } from '../lib/orders';
import { computeTotals, findPromo } from '../lib/pricing';
import { orderNumber, uid } from '../services/ids';
import type { Order } from '../types';

type F = { name: string; phone: string; email: string; street: string; postalCode: string; city: string; details: string };

export default function Checkout() {
  const { cart, mode, getProduct, promoCode, setPromoCode, placeOrder, clearCart, user, notify } = useStore();
  const navigate = useNavigate();
  const slots = useMemo(() => timeSlots(), []);
  const [f, setF] = useState<F>({
    name: user?.name ?? '', phone: user?.phone ?? '', email: user?.email ?? '',
    street: user?.address?.street ?? '', postalCode: user?.address?.postalCode ?? '', city: user?.address?.city ?? '', details: user?.address?.details ?? '',
  });
  const [slot, setSlot] = useState(slots[0]);
  const [payment, setPayment] = useState<Order['payment']>('en_ligne_simule');
  const [note, setNote] = useState('');
  const [code, setCode] = useState(promoCode);
  const [codeMsg, setCodeMsg] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof F, string>>>({});

  if (!cart.length) return <Navigate to="/menu" replace />;
  const t = computeTotals(cart, mode, promoCode);
  const set = (k: keyof F) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const applyCode = () => {
    const p = findPromo(code);
    if (!p) { setCodeMsg('Code inconnu. Essayez SMASH10, BIGFAIM ou LIVRAISON.'); return; }
    setPromoCode(p.code); setCodeMsg(`${p.code} : ${p.label}`); notify('Code promo appliqué');
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const er: Partial<Record<keyof F, string>> = {};
    if (f.name.trim().length < 2) er.name = 'Votre nom';
    if (f.phone.replace(/\D/g, '').length < 9) er.phone = 'Numéro invalide';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) er.email = 'E-mail invalide';
    if (mode === 'livraison') {
      if (!f.street.trim()) er.street = 'Adresse requise';
      if (!/^\d{5}$/.test(f.postalCode.trim())) er.postalCode = 'Code postal à 5 chiffres';
      if (!f.city.trim()) er.city = 'Ville requise';
    }
    setErrors(er);
    if (Object.keys(er).length) { document.getElementById(`f-${Object.keys(er)[0]}`)?.focus(); return; }
    if (t.missingForMin > 0) return;

    const order: Order = {
      id: uid(), number: orderNumber(), createdAt: new Date().toISOString(), mode, slot,
      customer: { name: f.name.trim(), phone: f.phone.trim(), email: f.email.trim() },
      address: mode === 'livraison' ? { street: f.street.trim(), postalCode: f.postalCode.trim(), city: f.city.trim(), details: f.details.trim() } : undefined,
      lines: cart.map((l) => ({ ...l, name: getProduct(l.productId)?.name ?? '' })),
      subtotal: t.subtotal, discount: t.discount, deliveryFee: t.deliveryFee, total: t.total,
      promoCode: promoCode && findPromo(promoCode) && !t.promoError ? promoCode : undefined,
      payment, status: 'recue', note: note.trim() || undefined,
    };
    placeOrder(order);
    clearCart();
    setPromoCode('');
    navigate(`/suivi/${order.id}`, { replace: true });
  };

  const input = (k: keyof F, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, className = '') => (
    <label className={`field ${className}`}>
      {label}
      <input id={`f-${k}`} value={f[k]} onChange={set(k)} aria-invalid={!!errors[k]} className={`input ${errors[k] ? 'border-tomato' : ''}`} {...props} />
      {errors[k] && <span className="text-xs text-tomato">{errors[k]}</span>}
    </label>
  );

  return (
    <div className="wrap pt-10">
      <Link to="/menu" className="text-sm font-bold text-ink/60 hover:text-ink">← Continuer mes achats</Link>
      <h1 className="h-display mt-2 text-6xl">Ma commande</h1>

      <form onSubmit={submit} noValidate className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <section className="card space-y-4">
            <h2 className="label">1. Comment ?</h2>
            <ModeSwitch />
            <label className="field">
              {mode === 'livraison' ? 'Heure de livraison' : 'Heure de retrait'}
              <select value={slot} onChange={(e) => setSlot(e.target.value)} className="input">
                {slots.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
          </section>

          <section className="card grid gap-4 sm:grid-cols-2">
            <h2 className="label sm:col-span-2">2. Vos coordonnées</h2>
            {input('name', 'Nom', { autoComplete: 'name' })}
            {input('phone', 'Téléphone', { type: 'tel', autoComplete: 'tel' })}
            {input('email', 'E-mail (pour le reçu)', { type: 'email', autoComplete: 'email' }, 'sm:col-span-2')}
          </section>

          {mode === 'livraison' && (
            <section className="card grid gap-4 sm:grid-cols-3">
              <h2 className="label sm:col-span-3">3. Adresse de livraison</h2>
              {input('street', 'Adresse', { autoComplete: 'street-address' }, 'sm:col-span-3')}
              {input('postalCode', 'Code postal', { inputMode: 'numeric', autoComplete: 'postal-code' })}
              {input('city', 'Ville', { autoComplete: 'address-level2' }, 'sm:col-span-2')}
              {input('details', 'Étage, code, interphone (facultatif)', {}, 'sm:col-span-3')}
            </section>
          )}

          <section className="card space-y-3">
            <h2 className="label">{mode === 'livraison' ? '4' : '3'}. Paiement</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {([['en_ligne_simule', 'Payer en ligne', CreditCard], ['sur_place', mode === 'livraison' ? 'Payer à la livraison' : 'Payer au comptoir', Store]] as const).map(([v, l, Icon]) => (
                <label key={v} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 font-bold transition ${payment === v ? 'border-ink bg-mustard/30' : 'border-ink/10'}`}>
                  <input type="radio" name="pay" checked={payment === v} onChange={() => setPayment(v)} className="h-4 w-4 accent-tomato" />
                  <Icon className="h-5 w-5" /> {l}
                </label>
              ))}
            </div>
            {payment === 'en_ligne_simule' && (
              <DemoNotice><b>Paiement simulé (démonstration).</b> Aucune carte n’est demandée ni débitée. En production : Stripe Checkout, paiement confirmé par webhook côté serveur.</DemoNotice>
            )}
            <label className="field">Un mot pour le restaurant ? <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={140} className="input" placeholder="Ex. couverts, serviettes en plus…" /></label>
          </section>
        </div>

        <aside className="h-fit space-y-4 rounded-[28px] bg-ink p-6 text-cream lg:sticky lg:top-32">
          <p className="h-display text-3xl">Récap · {MODE_LABELS[mode]}</p>
          <ul className="space-y-3 border-b border-white/10 pb-4">
            {cart.map((l) => (
              <li key={l.key} className="flex justify-between gap-3 text-sm">
                <div><p className="font-bold">{l.quantity} × {getProduct(l.productId)?.name}</p><p className="text-xs text-cream/60">{describe(l.options).join(' · ')}</p></div>
                <p className="font-bold">{formatPrice(l.unitPrice * l.quantity)}</p>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <label className="sr-only" htmlFor="promo">Code promo</label>
            <div className="flex flex-1 items-center gap-2 rounded-full bg-white/10 px-4"><Tag className="h-4 w-4 text-mustard" /><input id="promo" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code promo" className="min-h-11 w-full bg-transparent uppercase outline-none placeholder:normal-case placeholder:text-cream/40" /></div>
            <button type="button" onClick={applyCode} className="btn-yellow min-h-11 px-4 shadow-none">OK</button>
          </div>
          {(codeMsg || t.promoError) && <p className="text-xs text-mustard" role="status">{t.promoError ?? codeMsg}</p>}
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between"><dt>Sous-total</dt><dd>{formatPrice(t.subtotal)}</dd></div>
            {t.discount > 0 && <div className="flex justify-between text-mustard"><dt>Réduction</dt><dd>−{formatPrice(t.discount)}</dd></div>}
            {mode === 'livraison' && <div className="flex justify-between"><dt>Livraison</dt><dd>{t.deliveryFee ? formatPrice(t.deliveryFee) : 'Offerte'}</dd></div>}
            <div className="flex justify-between pt-2 text-2xl font-extrabold"><dt>Total</dt><dd>{formatPrice(t.total)}</dd></div>
          </dl>
          {t.missingForMin > 0 && <p className="rounded-xl bg-tomato/20 p-3 text-sm">Minimum 15 € en livraison : il manque {formatPrice(t.missingForMin)}.</p>}
          <button type="submit" disabled={t.missingForMin > 0} className="btn-red w-full text-base"><Lock className="h-4 w-4" /> Valider · {formatPrice(t.total)}</button>
          <p className="text-center text-xs text-cream/50">Démo : aucune commande n’est réellement envoyée au restaurant.</p>
        </aside>
      </form>
    </div>
  );
}
