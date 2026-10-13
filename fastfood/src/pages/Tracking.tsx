import { Bike, Check, ChefHat, PackageCheck, Search, ShoppingBag } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import DemoNotice from '../components/DemoNotice';
import { useStore } from '../context/StoreContext';
import { describe } from '../lib/describe';
import { formatPrice } from '../lib/format';
import { MODE_LABELS, STATUS_LABELS, stepsFor } from '../lib/orders';
import type { OrderStatus } from '../types';

const ICONS: Record<OrderStatus, typeof Check> = { recue: Check, preparation: ChefHat, prete: PackageCheck, livraison: Bike, terminee: ShoppingBag, annulee: Check };

export default function Tracking() {
  const { id } = useParams();
  const { orders } = useStore();
  const navigate = useNavigate();
  const [num, setNum] = useState('');
  const [err, setErr] = useState('');
  const order = orders.find((o) => o.id === id);

  const find = (e: FormEvent) => {
    e.preventDefault();
    const o = orders.find((x) => x.number.toLowerCase() === num.trim().toLowerCase());
    if (o) navigate(`/suivi/${o.id}`); else setErr('Commande introuvable (en démo, les commandes sont perdues au rechargement).');
  };

  if (!order) {
    return (
      <div className="wrap max-w-xl pt-14">
        <h1 className="h-display text-6xl">Suivre ma commande</h1>
        <form onSubmit={find} className="mt-6 flex gap-2">
          <label className="sr-only" htmlFor="num">Numéro de commande</label>
          <input id="num" value={num} onChange={(e) => setNum(e.target.value)} placeholder="Ex. SH-20261013-1234" className="input" />
          <button className="btn-red"><Search className="h-5 w-5" /> Suivre</button>
        </form>
        {err && <p className="mt-3 text-sm text-tomato">{err}</p>}
        {orders.length > 0 && (
          <div className="mt-8 space-y-2">
            <p className="label">Vos commandes de cette session</p>
            {orders.map((o) => <Link key={o.id} to={`/suivi/${o.id}`} className="card flex justify-between font-bold hover:ring-ink/30"><span>{o.number}</span><span>{STATUS_LABELS[o.status]}</span></Link>)}
          </div>
        )}
      </div>
    );
  }

  const steps = stepsFor(order.mode);
  const idx = steps.indexOf(order.status);
  const done = order.status === 'terminee';

  return (
    <div className="wrap max-w-3xl pt-12">
      <div className="rounded-[32px] bg-ink p-7 text-cream sm:p-10">
        <p className="label text-mustard">Commande {order.number} · {MODE_LABELS[order.mode]}</p>
        <h1 className="h-display mt-2 text-5xl sm:text-6xl">{done ? 'Bon appétit ! 🍔' : order.status === 'livraison' ? 'Votre livreur arrive 🛵' : order.status === 'prete' ? 'C’est prêt ! 🔔' : 'Ça chauffe en cuisine 🔥'}</h1>
        <p className="mt-2 text-cream/75">Merci {order.customer.name.split(' ')[0]} ! {order.mode === 'livraison' ? `Livraison prévue : ${order.slot}.` : `Retrait : ${order.slot}.`}</p>

        <ol className="mt-8 grid grid-cols-4 gap-2" aria-label="Avancement de la commande">
          {steps.map((s, i) => {
            const Icon = ICONS[s];
            const on = i <= idx;
            return (
              <li key={s} className="flex flex-col items-center gap-2 text-center">
                <span className={`grid h-14 w-14 place-items-center rounded-full transition ${on ? 'bg-mustard text-ink' : 'bg-white/10 text-cream/40'} ${i === idx && !done ? 'animate-pulse' : ''}`}><Icon className="h-6 w-6" /></span>
                <span className={`text-xs font-bold sm:text-sm ${on ? 'text-cream' : 'text-cream/40'}`}>{STATUS_LABELS[s]}</span>
              </li>
            );
          })}
        </ol>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-mustard transition-all duration-700" style={{ width: `${(idx / (steps.length - 1)) * 100}%` }} /></div>
      </div>

      <div className="mt-6"><DemoNotice><b>Démonstration :</b> le statut avance tout seul toutes les 20 secondes. Aucun paiement n’a été effectué et aucune commande n’est envoyée à un restaurant.</DemoNotice></div>

      <div className="card mt-6">
        <p className="label">Détail</p>
        <ul className="mt-3 divide-y divide-ink/10">
          {order.lines.map((l) => (
            <li key={l.key} className="flex justify-between gap-3 py-3 text-sm">
              <div><p className="font-bold">{l.quantity} × {l.name}</p><p className="text-xs text-ink/55">{describe(l.options).join(' · ')}</p></div>
              <p className="font-bold">{formatPrice(l.unitPrice * l.quantity)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-2 space-y-1 border-t border-ink/10 pt-3 text-sm">
          <div className="flex justify-between"><dt>Sous-total</dt><dd>{formatPrice(order.subtotal)}</dd></div>
          {order.discount > 0 && <div className="flex justify-between text-emerald-700"><dt>Réduction ({order.promoCode})</dt><dd>−{formatPrice(order.discount)}</dd></div>}
          {order.mode === 'livraison' && <div className="flex justify-between"><dt>Livraison</dt><dd>{order.deliveryFee ? formatPrice(order.deliveryFee) : 'Offerte'}</dd></div>}
          <div className="flex justify-between text-xl font-extrabold"><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
        </dl>
        <p className="mt-3 text-xs text-ink/55">Paiement : {order.payment === 'en_ligne_simule' ? 'en ligne (simulé, rien n’a été débité)' : 'sur place'}{order.address ? ` · ${order.address.street}, ${order.address.postalCode} ${order.address.city}` : ''}</p>
      </div>
      <div className="mt-6 text-center"><Link to="/menu" className="btn-red">Recommander</Link></div>
    </div>
  );
}
