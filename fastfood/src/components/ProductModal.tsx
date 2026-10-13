import { Minus, Plus, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { EXTRAS, MENU_DRINKS, MENU_SIDES, MENU_SUPPLEMENT, SAUCES, TAG_LABELS, XL_SUPPLEMENT } from '../data/menu';
import { formatPrice } from '../lib/format';
import { unitPrice } from '../lib/pricing';
import type { LineOptions, Product } from '../types';
import Img from './Img';

const REMOVABLE: Record<string, string[]> = {
  burger: ['Oignons', 'Pickles', 'Salade', 'Tomate', 'Sauce'],
  tacos: ['Frites dans le tacos', 'Salade', 'Tomate'],
};

function Radio({ name, value, current, onPick, children }: { name: string; value: string; current?: string; onPick: (v: string) => void; children: React.ReactNode }) {
  const on = current === value;
  return (
    <label className={`flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-2xl border-2 px-4 py-2 text-sm font-semibold transition ${on ? 'border-ink bg-mustard/30' : 'border-ink/10 hover:border-ink/40'}`}>
      <span className="flex items-center gap-3">
        <input type="radio" name={name} checked={on} onChange={() => onPick(value)} className="h-4 w-4 accent-tomato" />
        {children}
      </span>
    </label>
  );
}

export default function ProductModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const { addLine, notify, setCartOpen } = useStore();
  const kind = product.options;
  const [asMenu, setAsMenu] = useState(kind === 'menu');
  const [side, setSide] = useState(MENU_SIDES[0]);
  const [drink, setDrink] = useState(MENU_DRINKS[0]);
  const [extras, setExtras] = useState<string[]>([]);
  const [sauce, setSauce] = useState(kind === 'burger' || kind === 'tacos' || kind === 'side' ? SAUCES[0] : undefined);
  const [removed, setRemoved] = useState<string[]>([]);
  const [size, setSize] = useState<'normal' | 'xl'>('normal');
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  const canMenu = kind === 'burger' || kind === 'tacos';
  const canExtras = kind === 'burger' || kind === 'tacos';
  const canSize = kind === 'side' || kind === 'drink';

  const options: LineOptions = useMemo(() => ({
    ...(canMenu && asMenu ? { menu: { side, drink } } : {}),
    extras: [...extras].sort(),
    sauce,
    removed: [...removed].sort(),
    ...(canSize && size === 'xl' ? { size } : {}),
    ...(note.trim() ? { note: note.trim() } : {}),
  }), [canMenu, asMenu, side, drink, extras, sauce, removed, canSize, size, note]);

  const price = unitPrice(product, options);
  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const add = () => {
    addLine({ productId: product.id, quantity: qty, options, unitPrice: price });
    notify(`${qty} × ${product.name} ajouté${qty > 1 ? 's' : ''} au panier`);
    onClose();
    setCartOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={product.name}>
      <button className="absolute inset-0 bg-black/70" aria-label="Fermer" onClick={onClose} />
      <div className="relative flex max-h-[94vh] w-full max-w-2xl animate-up flex-col overflow-hidden rounded-t-[32px] bg-cream sm:rounded-[32px]">
        <button onClick={onClose} aria-label="Fermer" className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/90 shadow"><X className="h-5 w-5" /></button>
        <div className="overflow-y-auto">
          <Img src={product.image} alt={product.name} eager className="aspect-[16/10] w-full" />
          <div className="space-y-6 p-5 sm:p-7">
            <div>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {product.tags.map((t) => <span key={t} className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase ${TAG_LABELS[t].className}`}>{TAG_LABELS[t].label}</span>)}
              </div>
              <h2 className="h-display text-4xl sm:text-5xl">{product.name}</h2>
              <p className="mt-2 text-[15px] text-ink/75">{product.description}</p>
              <p className="mt-2 text-xs text-ink/55">{product.kcal} kcal · Allergènes : {product.allergens.length ? product.allergens.join(', ') : 'aucun majeur'}</p>
            </div>

            {canMenu && (
              <fieldset className="space-y-2">
                <legend className="label mb-2">Formule</legend>
                <div className="grid grid-cols-2 gap-2">
                  <Radio name="formule" value="seul" current={asMenu ? 'menu' : 'seul'} onPick={() => setAsMenu(false)}>Seul · {formatPrice(product.price)}</Radio>
                  <Radio name="formule" value="menu" current={asMenu ? 'menu' : 'seul'} onPick={() => setAsMenu(true)}>En menu · +{formatPrice(MENU_SUPPLEMENT)}</Radio>
                </div>
                {asMenu && (
                  <div className="grid gap-4 rounded-2xl bg-white p-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-2 text-sm font-bold">Accompagnement</p>
                      <div className="space-y-2">{MENU_SIDES.map((s) => <Radio key={s} name="side" value={s} current={side} onPick={setSide}>{s}</Radio>)}</div>
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-bold">Boisson</p>
                      <div className="space-y-2">{MENU_DRINKS.map((d) => <Radio key={d} name="drink" value={d} current={drink} onPick={setDrink}>{d}</Radio>)}</div>
                    </div>
                  </div>
                )}
              </fieldset>
            )}

            {canSize && (
              <fieldset>
                <legend className="label mb-2">Taille</legend>
                <div className="grid grid-cols-2 gap-2">
                  <Radio name="size" value="normal" current={size} onPick={() => setSize('normal')}>Normale</Radio>
                  <Radio name="size" value="xl" current={size} onPick={() => setSize('xl')}>XL · +{formatPrice(XL_SUPPLEMENT)}</Radio>
                </div>
              </fieldset>
            )}

            {sauce !== undefined && (
              <fieldset>
                <legend className="label mb-2">Sauce</legend>
                <div className="flex flex-wrap gap-2">
                  {SAUCES.map((s) => (
                    <button key={s} type="button" aria-pressed={sauce === s} onClick={() => setSauce(s)} className={`chip ${sauce === s ? 'chip-on' : 'chip-off'}`}>{s}</button>
                  ))}
                </div>
              </fieldset>
            )}

            {canExtras && (
              <fieldset>
                <legend className="label mb-2">Suppléments</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {EXTRAS.map((e) => (
                    <label key={e.id} className={`flex min-h-12 cursor-pointer items-center justify-between rounded-2xl border-2 px-4 text-sm font-semibold transition ${extras.includes(e.id) ? 'border-ink bg-mustard/30' : 'border-ink/10 hover:border-ink/40'}`}>
                      <span className="flex items-center gap-3">
                        <input type="checkbox" checked={extras.includes(e.id)} onChange={() => setExtras(toggle(extras, e.id))} className="h-4 w-4 accent-tomato" />
                        {e.label}
                      </span>
                      <span>+{formatPrice(e.price)}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {REMOVABLE[kind] && (
              <fieldset>
                <legend className="label mb-2">Retirer un ingrédient</legend>
                <div className="flex flex-wrap gap-2">
                  {REMOVABLE[kind].map((r) => (
                    <button key={r} type="button" aria-pressed={removed.includes(r)} onClick={() => setRemoved(toggle(removed, r))}
                      className={`chip ${removed.includes(r) ? 'border-tomato bg-tomato text-white line-through' : 'chip-off'}`}>Sans {r.toLowerCase()}</button>
                  ))}
                </div>
              </fieldset>
            )}

            <label className="field">
              Une précision pour la cuisine ?
              <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} placeholder="Ex. bien cuit, sauce à part…" className="input" />
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-ink/10 bg-white p-4">
          <div className="flex items-center rounded-full border-2 border-ink/15">
            <button type="button" aria-label="Moins" onClick={() => setQty(Math.max(1, qty - 1))} className="grid h-12 w-12 place-items-center"><Minus className="h-4 w-4" /></button>
            <span className="w-6 text-center font-extrabold" aria-live="polite">{qty}</span>
            <button type="button" aria-label="Plus" onClick={() => setQty(Math.min(20, qty + 1))} className="grid h-12 w-12 place-items-center"><Plus className="h-4 w-4" /></button>
          </div>
          <button type="button" onClick={add} className="btn-red flex-1 justify-between px-6 text-base">
            <span>Ajouter</span><span>{formatPrice(price * qty)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
