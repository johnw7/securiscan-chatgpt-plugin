import { SearchX, SlidersHorizontal, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductGrid from '../components/ProductGrid';
import { useStore } from '../context/StoreContext';
import { CATEGORY_LABELS } from '../data/products';
import { ALL_SIZES, type Category, type Product } from '../types';

const PRICE_RANGES = [
  { id: '0-30', label: 'Moins de 30 €', min: 0, max: 3000 },
  { id: '30-60', label: '30 € – 60 €', min: 3000, max: 6000 },
  { id: '60-120', label: '60 € – 120 €', min: 6000, max: 12000 },
  { id: '120+', label: 'Plus de 120 €', min: 12000, max: Infinity },
];

const SORTS = [
  { id: 'nouveautes', label: 'Nouveautés' },
  { id: 'prix-asc', label: 'Prix croissant' },
  { id: 'prix-desc', label: 'Prix décroissant' },
  { id: 'populaires', label: 'Meilleures ventes' },
];

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function Catalog() {
  const { products } = useStore();
  const [params, setParams] = useSearchParams();
  const [drawer, setDrawer] = useState(false);

  const category = params.get('categorie') as Category | null;
  const promo = params.get('promo') === '1';
  const q = params.get('q') ?? '';
  const sort = params.get('tri') ?? 'nouveautes';
  const sizes = params.getAll('taille');
  const colors = params.getAll('couleur');
  const price = params.get('prix');

  const update = (fn: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(params);
    fn(next);
    setParams(next, { replace: true });
  };
  const toggleMulti = (key: string, value: string) =>
    update((p) => {
      const cur = p.getAll(key);
      p.delete(key);
      (cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value]).forEach((v) => p.append(key, v));
    });
  const setSingle = (key: string, value: string | null) => update((p) => (value ? p.set(key, value) : p.delete(key)));
  const reset = () => setParams(category ? { categorie: category } : {}, { replace: true });

  const allColors = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => p.colors.forEach((c) => map.set(c.name, c.hex)));
    return [...map].map(([name, hex]) => ({ name, hex }));
  }, [products]);

  const results = useMemo(() => {
    const range = PRICE_RANGES.find((r) => r.id === price);
    const terms = norm(q).split(/\s+/).filter(Boolean);
    const list = products.filter((p: Product) => {
      if (category && p.category !== category) return false;
      if (promo && !(p.compareAtPrice && p.compareAtPrice > p.price)) return false;
      if (sizes.length && !sizes.some((s) => p.sizes.includes(s as Product['sizes'][number]))) return false;
      if (colors.length && !p.colors.some((c) => colors.includes(c.name))) return false;
      if (range && (p.price < range.min || p.price >= range.max)) return false;
      if (terms.length) {
        const hay = norm(`${p.name} ${p.type} ${CATEGORY_LABELS[p.category]} ${p.colors.map((c) => c.name).join(' ')} ${p.description}`);
        if (!terms.every((t) => hay.includes(t))) return false;
      }
      return true;
    });
    const sorted = [...list];
    if (sort === 'prix-asc') sorted.sort((a, b) => a.price - b.price);
    else if (sort === 'prix-desc') sorted.sort((a, b) => b.price - a.price);
    else if (sort === 'populaires') sorted.sort((a, b) => b.sold - a.sold);
    else sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return sorted;
  }, [products, category, promo, q, sort, sizes, colors, price]);

  const title = q ? `Résultats pour « ${q} »` : promo ? 'Promotions' : category ? CATEGORY_LABELS[category] : 'Toute la collection';
  const activeCount = sizes.length + colors.length + (price ? 1 : 0) + (promo ? 1 : 0);

  const filters = (
    <div className="flex flex-col gap-8">
      <fieldset>
        <legend className="label-caps mb-3">Catégorie</legend>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setSingle('categorie', null)} className={`chip ${!category ? 'chip-on' : 'chip-off'}`}>Tout</button>
          {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
            <button type="button" key={c} onClick={() => setSingle('categorie', c)} className={`chip ${category === c ? 'chip-on' : 'chip-off'}`}>{CATEGORY_LABELS[c]}</button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="label-caps mb-3">Taille</legend>
        <div className="grid grid-cols-3 gap-2">
          {ALL_SIZES.map((s) => (
            <button type="button" key={s} aria-pressed={sizes.includes(s)} onClick={() => toggleMulti('taille', s)} className={`chip ${sizes.includes(s) ? 'chip-on' : 'chip-off'}`}>{s}</button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="label-caps mb-3">Couleur</legend>
        <div className="flex flex-wrap gap-3">
          {allColors.map((c) => {
            const on = colors.includes(c.name);
            return (
              <button type="button" key={c.name} onClick={() => toggleMulti('couleur', c.name)} aria-pressed={on} aria-label={c.name} title={c.name}
                className={`h-9 w-9 rounded-full border border-mist-300 transition ${on ? 'ring-2 ring-ink ring-offset-2' : 'hover:scale-110'}`} style={{ background: c.hex }} />
            );
          })}
        </div>
      </fieldset>
      <fieldset>
        <legend className="label-caps mb-3">Prix</legend>
        <div className="flex flex-col gap-2">
          {PRICE_RANGES.map((r) => (
            <label key={r.id} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
              <input type="radio" name="prix" checked={price === r.id} onChange={() => setSingle('prix', r.id)} className="h-4 w-4 accent-ink" />
              {r.label}
            </label>
          ))}
          {price && <button type="button" onClick={() => setSingle('prix', null)} className="self-start text-sm underline">Tous les prix</button>}
        </div>
      </fieldset>
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
        <input type="checkbox" checked={promo} onChange={() => setSingle('promo', promo ? null : '1')} className="h-4 w-4 accent-ink" />
        Uniquement les promotions
      </label>
      <button type="button" onClick={reset} className="btn-secondary">Réinitialiser les filtres</button>
    </div>
  );

  return (
    <div className="container-page pt-8">
      <p className="text-sm text-mist-500">Accueil / Catalogue{category ? ` / ${CATEGORY_LABELS[category]}` : ''}</p>
      <h1 className="mt-1 font-display text-4xl md:text-5xl">{title}</h1>

      <div className="sticky top-[118px] z-20 -mx-4 mt-6 flex flex-wrap items-center justify-between gap-3 border-y border-mist-200 bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-full sm:border sm:px-5 lg:top-[106px]">
        <button type="button" onClick={() => setDrawer(true)} className="btn-ghost lg:hidden">
          <SlidersHorizontal className="h-4 w-4" /> Filtres{activeCount ? ` (${activeCount})` : ''}
        </button>
        <span className="hidden text-sm text-mist-500 lg:block">{results.length} article{results.length > 1 ? 's' : ''}</span>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-mist-500">Trier par</span>
          <select value={sort} onChange={(e) => setSingle('tri', e.target.value)} className="min-h-11 rounded-full border border-mist-300 bg-white px-4 text-sm">
            {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-8 flex gap-10">
        <aside aria-label="Filtres" className="hidden w-60 flex-none lg:block">{filters}</aside>
        <div className="min-w-0 flex-1">
          <p className="mb-4 text-sm text-mist-500 lg:hidden">{results.length} article{results.length > 1 ? 's' : ''}</p>
          {results.length ? (
            <ProductGrid products={results} />
          ) : (
            <div className="flex flex-col items-center rounded-3xl bg-sand-50 px-6 py-16 text-center">
              <SearchX className="mb-3 h-10 w-10 text-sand-600" strokeWidth={1.3} />
              <p className="font-display text-2xl">Aucun article ne correspond</p>
              <p className="mt-2 text-sm text-mist-500">Essayez d’élargir vos filtres ou une autre recherche.</p>
              <button type="button" onClick={() => setParams({}, { replace: true })} className="btn-primary mt-6">Voir toute la collection</button>
            </div>
          )}
        </div>
      </div>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filtres">
          <button className="absolute inset-0 bg-black/30" aria-label="Fermer" onClick={() => setDrawer(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[88vh] animate-fade-up overflow-y-auto rounded-t-3xl bg-white p-6">
            <div className="mb-6 flex items-center justify-between">
              <p className="font-display text-2xl">Filtres</p>
              <button className="grid h-11 w-11 place-items-center rounded-full" aria-label="Fermer" onClick={() => setDrawer(false)}><X className="h-6 w-6" /></button>
            </div>
            {filters}
            <button type="button" onClick={() => setDrawer(false)} className="btn-primary sticky bottom-0 mt-6 w-full">Voir {results.length} article{results.length > 1 ? 's' : ''}</button>
          </div>
        </div>
      )}
    </div>
  );
}
