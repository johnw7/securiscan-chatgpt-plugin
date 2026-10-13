import { Leaf, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ModeSwitch from '../components/ModeSwitch';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import { useStore } from '../context/StoreContext';
import { CATEGORIES } from '../data/menu';
import type { Product } from '../types';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function Menu() {
  const { products } = useStore();
  const [q, setQ] = useState('');
  const [veggie, setVeggie] = useState(false);
  const [open, setOpen] = useState<Product | null>(null);
  const [active, setActive] = useState<string>(CATEGORIES[0].id);
  const { hash } = useLocation();

  // Ancre #burgers, #menus… depuis l'accueil (hors routeur à hachage, où le # sert aux routes).
  useEffect(() => {
    const id = hash.replace('#', '');
    if (id) setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }, [hash]);

  // Onglet actif selon la section visible.
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      const v = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (v) setActive(v.target.id);
    }, { rootMargin: '-180px 0px -55% 0px' });
    CATEGORIES.forEach((c) => { const el = document.getElementById(c.id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  const filtered = useMemo(() => {
    const terms = norm(q).split(/\s+/).filter(Boolean);
    return products.filter((p) => (!veggie || p.tags.includes('veggie')) && terms.every((t) => norm(`${p.name} ${p.description}`).includes(t)));
  }, [products, q, veggie]);

  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div>
      <section className="bg-ink pb-10 pt-12 text-cream">
        <div className="wrap">
          <p className="label text-mustard">Faites-vous plaisir</p>
          <h1 className="h-display mt-1 text-6xl sm:text-7xl">La carte</h1>
          <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_420px]">
            <label className="flex min-h-14 items-center gap-3 rounded-2xl bg-white px-4 text-ink">
              <Search className="h-5 w-5 text-ink/40" aria-hidden="true" />
              <span className="sr-only">Rechercher un plat</span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Un burger, des frites, du cheddar…" className="min-w-0 flex-1 bg-transparent text-base outline-none" />
            </label>
            <ModeSwitch dark />
          </div>
        </div>
      </section>

      <nav aria-label="Catégories" className="sticky top-[100px] z-30 border-b border-ink/10 bg-cream/95 backdrop-blur">
        <div className="wrap no-scrollbar flex gap-2 overflow-x-auto py-3">
          {CATEGORIES.map((c) => (
            <button key={c.id} type="button" onClick={() => go(c.id)} className={`chip flex-none ${active === c.id ? 'chip-on' : 'chip-off'}`}>
              <span aria-hidden="true">{c.emoji}</span> {c.label}
            </button>
          ))}
          <button type="button" onClick={() => setVeggie(!veggie)} aria-pressed={veggie} className={`chip flex-none ${veggie ? 'border-emerald-600 bg-emerald-600 text-white' : 'chip-off'}`}>
            <Leaf className="h-4 w-4" /> Végé
          </button>
        </div>
      </nav>

      <div className="wrap">
        {filtered.length === 0 && (
          <div className="mt-12 rounded-3xl bg-white p-10 text-center">
            <p className="h-display text-4xl">Rien trouvé 😢</p>
            <button onClick={() => { setQ(''); setVeggie(false); }} className="btn-red mt-4">Voir toute la carte</button>
          </div>
        )}
        {CATEGORIES.map((c) => {
          const items = filtered.filter((p) => p.category === c.id);
          if (!items.length) return <section key={c.id} id={c.id} />;
          return (
            <section key={c.id} id={c.id} className="scroll-mt-44 pt-12">
              <h2 className="h-display mb-5 text-5xl">{c.emoji} {c.label}</h2>
              <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
                {items.map((p) => <ProductCard key={p.id} product={p} onOpen={setOpen} />)}
              </div>
            </section>
          );
        })}
      </div>
      {open && <ProductModal product={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
