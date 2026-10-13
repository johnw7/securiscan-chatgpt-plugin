import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { describe } from '../lib/describe';
import { formatPrice } from '../lib/format';
import { computeTotals, FREE_DELIVERY_FROM } from '../lib/pricing';
import Img from './Img';
import ModeSwitch from './ModeSwitch';

export default function CartDrawer() {
  const { cart, cartOpen, setCartOpen, getProduct, setQuantity, removeLine, mode, promoCode } = useStore();
  const navigate = useNavigate();
  const t = computeTotals(cart, mode, promoCode);

  useEffect(() => {
    if (!cartOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setCartOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cartOpen, setCartOpen]);

  if (!cartOpen) return null;
  const progress = Math.min(100, ((FREE_DELIVERY_FROM - t.missingForFreeDelivery) / FREE_DELIVERY_FROM) * 100);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Votre panier">
      <button className="absolute inset-0 bg-black/60" aria-label="Fermer le panier" onClick={() => setCartOpen(false)} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md animate-slide flex-col bg-cream">
        <div className="flex items-center justify-between bg-ink px-5 py-4 text-cream">
          <p className="h-display text-3xl">Votre panier</p>
          <button onClick={() => setCartOpen(false)} aria-label="Fermer" className="grid h-11 w-11 place-items-center rounded-full hover:bg-white/10"><X className="h-6 w-6" /></button>
        </div>
        <div className="p-4"><ModeSwitch /></div>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <ShoppingBag className="h-12 w-12 text-crust" />
            <p className="h-display text-3xl">Votre panier a faim</p>
            <p className="text-sm text-ink/60">Ajoutez un smash burger, on s’occupe du reste.</p>
            <button onClick={() => { setCartOpen(false); navigate('/menu'); }} className="btn-red mt-2">Voir la carte</button>
          </div>
        ) : (
          <>
            {mode === 'livraison' && (
              <div className="mx-4 rounded-2xl bg-white p-3 text-sm">
                {t.missingForFreeDelivery > 0 ? <>Plus que <b>{formatPrice(t.missingForFreeDelivery)}</b> pour la livraison offerte 🛵</> : <b>Livraison offerte ! 🎉</b>}
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink/10"><div className="h-full rounded-full bg-tomato transition-all" style={{ width: `${progress}%` }} /></div>
              </div>
            )}
            <ul className="flex-1 space-y-3 overflow-y-auto p-4">
              {cart.map((l) => {
                const p = getProduct(l.productId);
                if (!p) return null;
                return (
                  <li key={l.key} className="flex gap-3 rounded-2xl bg-white p-3">
                    <Img src={p.image} alt={p.name} className="h-20 w-20 flex-none rounded-xl" />
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-2"><p className="font-extrabold leading-tight">{p.name}</p><p className="font-extrabold">{formatPrice(l.unitPrice * l.quantity)}</p></div>
                      <ul className="mt-1 space-y-0.5 text-xs text-ink/60">{describe(l.options).map((d) => <li key={d}>{d}</li>)}</ul>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center rounded-full border-2 border-ink/10">
                          <button aria-label="Moins" onClick={() => setQuantity(l.key, l.quantity - 1)} className="grid h-10 w-10 place-items-center"><Minus className="h-4 w-4" /></button>
                          <span className="w-5 text-center text-sm font-bold">{l.quantity}</span>
                          <button aria-label="Plus" onClick={() => setQuantity(l.key, l.quantity + 1)} className="grid h-10 w-10 place-items-center"><Plus className="h-4 w-4" /></button>
                        </div>
                        <button onClick={() => removeLine(l.key)} aria-label={`Supprimer ${p.name}`} className="grid h-10 w-10 place-items-center rounded-full text-ink/50 hover:bg-tomato/10 hover:text-tomato"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="space-y-2 border-t border-ink/10 bg-white p-4 text-sm">
              <div className="flex justify-between"><span>Sous-total</span><span>{formatPrice(t.subtotal)}</span></div>
              {t.discount > 0 && <div className="flex justify-between text-emerald-700"><span>Réduction</span><span>−{formatPrice(t.discount)}</span></div>}
              {mode === 'livraison' && <div className="flex justify-between"><span>Livraison</span><span>{t.deliveryFee ? formatPrice(t.deliveryFee) : 'Offerte'}</span></div>}
              <div className="flex justify-between pt-1 text-lg font-extrabold"><span>Total</span><span>{formatPrice(t.total)}</span></div>
              {t.missingForMin > 0 && <p className="rounded-xl bg-mustard/30 p-2 text-xs font-semibold">Minimum de 15 € en livraison : encore {formatPrice(t.missingForMin)}.</p>}
              <button disabled={t.missingForMin > 0} onClick={() => { setCartOpen(false); navigate('/commande'); }} className="btn-red w-full text-base">Commander · {formatPrice(t.total)}</button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
