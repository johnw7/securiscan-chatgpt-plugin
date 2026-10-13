import { ArrowRight, Clock, Flame, MapPin, Phone, Star, Timer, Truck } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Img from '../components/Img';
import ModeSwitch from '../components/ModeSwitch';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import { useStore } from '../context/StoreContext';
import { BRAND, CATEGORIES, IMG } from '../data/menu';
import type { Product } from '../types';

const REVIEWS = [
  { name: 'Yanis', text: 'Le Smash Classique est une dinguerie. Les bords croustillants, la sauce… je reviens chaque semaine.', stars: 5 },
  { name: 'Sarah', text: 'Livré en 25 minutes, encore chaud. Les frites cheddar bacon valent le détour !', stars: 5 },
  { name: 'Thomas', text: 'Le tacos XL est énorme et vraiment bon. Commande en ligne super simple.', stars: 4 },
];

export default function Home() {
  const { products } = useStore();
  const [open, setOpen] = useState<Product | null>(null);
  const best = [...products].filter((p) => p.available && p.category !== 'drinks').sort((a, b) => b.sold - a.sold).slice(0, 4);
  const firstOf = (cat: string) => products.find((p) => p.category === cat);

  return (
    <div>
      {/* Bannière */}
      <section className="relative overflow-hidden bg-ink text-cream">
        <Img src={IMG.hero} alt="Smash burger au cheddar fondant, frites et boisson" eager className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-ink/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-transparent to-transparent lg:hidden" />
        <div className="wrap relative grid min-h-[600px] items-center py-14 lg:min-h-[640px]">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-tomato px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider"><Flame className="h-4 w-4" /> Fait minute, smashé à la plancha</p>
            <h1 className="h-display mt-5 text-[64px] sm:text-[92px] lg:text-[112px]">
              Le smash<br />qui fait <span className="text-mustard">craquer.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-cream/85">Steaks écrasés aux bords croustillants, cheddar qui coule, frites maison. Commandez en 1 minute.</p>
            <div className="mt-7 max-w-md"><ModeSwitch dark /></div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/menu" className="btn-red px-8 text-base">Commander maintenant <ArrowRight className="h-5 w-5" /></Link>
              <Link to="/menu#menus" className="btn-ghost text-cream">Voir les menus</Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-cream/80">
              <span className="flex items-center gap-1.5"><Star className="h-4 w-4 fill-mustard text-mustard" /> 4,8/5 (avis démo)</span>
              <span className="flex items-center gap-1.5"><Timer className="h-4 w-4 text-mustard" /> Prêt en 15 min</span>
              <span className="flex items-center gap-1.5"><Truck className="h-4 w-4 text-mustard" /> Livraison offerte dès 25 €</span>
            </div>
          </div>
        </div>
      </section>

      {/* Catégories */}
      <section className="wrap -mt-10 relative z-10">
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((c) => {
            const p = firstOf(c.id);
            return (
              <Link key={c.id} to={`/menu#${c.id}`} className="group flex min-w-[150px] flex-col overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-ink/5 transition hover:-translate-y-1">
                {p && <Img src={p.image} alt="" className="aspect-[4/3] w-full transition duration-500 group-hover:scale-110" />}
                <span className="flex items-center justify-between px-4 py-3 font-extrabold">{c.label} <ArrowRight className="h-4 w-4 text-tomato transition group-hover:translate-x-1" /></span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Best-sellers */}
      <section className="wrap mt-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="label">Les plus commandés</p>
            <h2 className="h-display mt-1 text-5xl sm:text-6xl">Nos best-sellers 🔥</h2>
          </div>
          <Link to="/menu" className="hidden items-center gap-1 font-bold text-tomato hover:underline sm:flex">Toute la carte <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {best.map((p) => <ProductCard key={p.id} product={p} onOpen={setOpen} />)}
        </div>
      </section>

      {/* Promo */}
      <section className="wrap mt-20">
        <div className="relative overflow-hidden rounded-[36px] bg-mustard">
          <Img src={IMG.promo} alt="Deux smash burgers et des frites" className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-r from-mustard via-mustard/85 to-transparent" />
          <div className="relative max-w-xl p-8 sm:p-12">
            <p className="label text-ink">Offre de la semaine</p>
            <h2 className="h-display mt-2 text-6xl sm:text-7xl">−10 % <br />avec <span className="text-tomato">SMASH10</span></h2>
            <p className="mt-3 max-w-sm font-semibold">Et −20 % dès 30 € avec le code BIGFAIM. Parfait pour le repas entre potes.</p>
            <Link to="/menu" className="btn-red mt-6">J’en profite <ArrowRight className="h-5 w-5" /></Link>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="wrap mt-20">
        <p className="label text-center">Simple comme bonjour</p>
        <h2 className="h-display mt-1 text-center text-5xl sm:text-6xl">Commandez en 3 étapes</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { n: '1', t: 'Choisissez', d: 'Burgers, tacos, frites… personnalisez sauces et suppléments.' },
            { n: '2', t: 'Validez', d: 'Livraison, à emporter ou sur place. Choisissez votre créneau.' },
            { n: '3', t: 'Régalez-vous', d: 'Suivez votre commande en direct jusqu’à la dernière bouchée.' },
          ].map((s) => (
            <div key={s.n} className="card relative overflow-hidden p-7">
              <span className="h-display absolute -right-2 -top-6 text-[140px] text-mustard/40">{s.n}</span>
              <p className="h-display relative text-4xl">{s.t}</p>
              <p className="relative mt-2 text-ink/70">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cuisine + avis */}
      <section className="wrap mt-20 grid gap-6 lg:grid-cols-2">
        <div className="relative min-h-[380px] overflow-hidden rounded-[36px] bg-ink text-cream">
          <Img src={IMG.kitchen} alt="Chef qui smashe les steaks sur la plancha" className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
          <div className="absolute bottom-0 p-8">
            <p className="label text-mustard">Notre secret</p>
            <h2 className="h-display mt-1 text-5xl">Smashé à la minute</h2>
            <p className="mt-2 max-w-md text-cream/80">Bœuf frais haché chaque matin, écrasé sur la plancha brûlante pour une croûte caramélisée inimitable.</p>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          {REVIEWS.map((r) => (
            <figure key={r.name} className="card">
              <div className="flex items-center justify-between">
                <span className="flex gap-0.5" role="img" aria-label={`${r.stars} sur 5`}>{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-5 w-5 ${i < r.stars ? 'fill-mustard text-mustard' : 'text-ink/15'}`} />)}</span>
                <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[11px] font-bold uppercase text-ink/50">Avis démo</span>
              </div>
              <blockquote className="mt-3 text-lg font-semibold">« {r.text} »</blockquote>
              <figcaption className="mt-2 text-sm text-ink/55">{r.name}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Infos */}
      <section id="infos" className="wrap mt-20 scroll-mt-32">
        <div className="grid gap-6 rounded-[36px] bg-ink p-8 text-cream sm:p-12 lg:grid-cols-3">
          <div>
            <p className="label text-mustard">Venez nous voir</p>
            <h2 className="h-display mt-1 text-5xl">Infos pratiques</h2>
          </div>
          <div className="space-y-3">
            <p className="flex gap-3"><MapPin className="h-5 w-5 flex-none text-mustard" /> {BRAND.address}</p>
            <p className="flex gap-3"><Phone className="h-5 w-5 flex-none text-mustard" /> {BRAND.phone}</p>
          </div>
          <div className="space-y-2">
            {BRAND.hours.map((h) => <p key={h.days} className="flex gap-3"><Clock className="h-5 w-5 flex-none text-mustard" /> <b className="w-24">{h.days}</b> {h.time}</p>)}
          </div>
        </div>
      </section>

      {open && <ProductModal product={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
