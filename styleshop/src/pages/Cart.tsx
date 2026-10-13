import { ShoppingBag, Tag, Trash2, Truck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import ProductImage from '../components/ProductImage';
import QuantitySelector from '../components/QuantitySelector';
import { useStore } from '../context/StoreContext';
import { formatPrice } from '../lib/format';
import { computeTotals, findPromo, FREE_SHIPPING_THRESHOLD } from '../lib/pricing';

export default function Cart() {
  const { cart, products, getProduct, updateQuantity, removeFromCart, promoCode, setPromoCode, notify } = useStore();
  const navigate = useNavigate();
  const [code, setCode] = useState(promoCode);
  const [promoError, setPromoError] = useState('');
  const totals = computeTotals(cart, products, 'standard', promoCode);
  const promo = promoCode ? findPromo(promoCode) : undefined;

  if (!cart.length) {
    return (
      <div className="container-page pt-10">
        <h1 className="mb-8 font-display text-4xl md:text-5xl">Mon panier</h1>
        <EmptyState icon={ShoppingBag} title="Votre panier est vide" text="Parcourez la collection et ajoutez vos pièces préférées." />
      </div>
    );
  }

  const apply = (e: FormEvent) => {
    e.preventDefault();
    if (findPromo(code)) {
      setPromoCode(code.trim().toUpperCase());
      setPromoError('');
      notify('Code promo appliqué');
    } else {
      setPromoError('Code invalide. Codes de démo : BIENVENUE10, STYLE20, LIVRAISON.');
    }
  };

  const progress = Math.min(100, Math.round(((FREE_SHIPPING_THRESHOLD - totals.freeShippingRemaining) / FREE_SHIPPING_THRESHOLD) * 100));

  return (
    <div className="container-page pt-10">
      <h1 className="font-display text-4xl md:text-5xl">Mon panier</h1>
      <p className="mt-1 text-sm text-mist-500">{totals.itemCount} article{totals.itemCount > 1 ? 's' : ''}</p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px]">
        <div>
          <div className="mb-4 rounded-2xl bg-sand-50 p-4">
            <p className="flex items-center gap-2 text-sm">
              <Truck className="h-4 w-4" />
              {totals.freeShippingRemaining > 0
                ? <>Plus que <strong>{formatPrice(totals.freeShippingRemaining)}</strong> pour la livraison standard offerte.</>
                : <>Livraison standard <strong>offerte</strong> !</>}
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-sand-200" aria-hidden="true">
              <div className="h-full rounded-full bg-ink transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <ul className="divide-y divide-mist-200">
            {cart.map((item) => {
              const p = getProduct(item.productId);
              if (!p) return null;
              return (
                <li key={`${item.productId}-${item.size}-${item.color}`} className="flex gap-4 py-5 sm:gap-6">
                  <Link to={`/produit/${p.id}`} className="w-24 flex-none overflow-hidden rounded-xl sm:w-28">
                    <ProductImage src={p.images[0]} alt={p.name} fallbackLabel={p.type} className="aspect-[3/4] w-full" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex justify-between gap-3">
                      <Link to={`/produit/${p.id}`} className="font-medium hover:underline">{p.name}</Link>
                      <span className="whitespace-nowrap font-semibold">{formatPrice(p.price * item.quantity)}</span>
                    </div>
                    <p className="mt-1 text-sm text-mist-500">Taille : <strong className="text-ink">{item.size}</strong> · Couleur : <strong className="text-ink">{item.color}</strong></p>
                    <p className="text-sm text-mist-500">{formatPrice(p.price)} l’unité</p>
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                      <QuantitySelector small value={item.quantity} max={Math.min(10, p.stock)} onChange={(n) => updateQuantity(p.id, item.size, item.color, n)} />
                      <button type="button" onClick={() => { removeFromCart(p.id, item.size, item.color); notify('Article supprimé'); }} className="btn-ghost text-mist-500">
                        <Trash2 className="h-4 w-4" /> Supprimer
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <aside aria-label="Récapitulatif" className="h-fit rounded-3xl bg-sand-50 p-6 lg:sticky lg:top-36">
          <p className="font-display text-2xl">Récapitulatif</p>
          <form onSubmit={apply} className="mt-5">
            <label htmlFor="promo" className="label-caps">Code promo</label>
            <div className="mt-2 flex gap-2">
              <input id="promo" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ex. BIENVENUE10" className="input min-h-11 flex-1 rounded-full uppercase" />
              <button className="btn-secondary min-h-11 px-5">Appliquer</button>
            </div>
            {promoError && <p className="mt-2 text-sm text-red-700" role="alert">{promoError}</p>}
            {promo && (
              <p className="mt-2 flex items-center justify-between text-sm text-green-800">
                <span className="flex items-center gap-1.5"><Tag className="h-4 w-4" /> {promo.code} : {promo.label}</span>
                <button type="button" className="underline" onClick={() => { setPromoCode(''); setCode(''); }}>Retirer</button>
              </p>
            )}
          </form>

          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between"><dt>Sous-total</dt><dd>{formatPrice(totals.subtotal)}</dd></div>
            {totals.discount > 0 && <div className="flex justify-between text-green-800"><dt>Réduction</dt><dd>−{formatPrice(totals.discount)}</dd></div>}
            <div className="flex justify-between"><dt>Livraison standard</dt><dd>{totals.shipping ? formatPrice(totals.shipping) : 'Offerte'}</dd></div>
            <div className="flex justify-between border-t border-sand-200 pt-4 text-lg font-semibold"><dt>Total TTC</dt><dd>{formatPrice(totals.total)}</dd></div>
          </dl>
          <p className="mt-2 text-xs text-mist-500">Mode de livraison modifiable à l’étape suivante.</p>
          <button type="button" onClick={() => navigate('/commande')} className="btn-primary mt-6 w-full">Passer commande</button>
          <Link to="/catalogue" className="mt-3 block text-center text-sm underline-offset-4 hover:underline">Continuer mes achats</Link>
        </aside>
      </div>
    </div>
  );
}
