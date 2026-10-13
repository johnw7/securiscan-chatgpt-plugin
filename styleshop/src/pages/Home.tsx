import { ArrowRight, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductGrid from '../components/ProductGrid';
import ProductImage from '../components/ProductImage';
import SectionHeader from '../components/SectionHeader';
import { useStore } from '../context/StoreContext';
import { CATEGORY_IMAGES, CATEGORY_LABELS, IMG } from '../data/products';
import type { Category } from '../types';

export default function Home() {
  const { products } = useStore();
  const newest = [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
  const best = [...products].sort((a, b) => b.sold - a.sold).slice(0, 4);
  const promos = products.filter((p) => p.compareAtPrice && p.compareAtPrice > p.price).slice(0, 4);
  const cats = Object.keys(CATEGORY_LABELS) as Category[];

  return (
    <div>
      {/* Bannière */}
      <section className="container-page mt-4 grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <div className="relative min-h-[520px] overflow-hidden rounded-3xl md:min-h-[620px]">
          <ProductImage src={IMG.heroWoman} alt="Mannequin portant la collection automne-hiver" eager fallbackLabel="" className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="relative flex h-full min-h-[520px] flex-col justify-end p-6 text-white md:min-h-[620px] md:p-12">
            <p className="text-xs uppercase tracking-[0.22em] text-white/85">Collection automne–hiver 2026</p>
            <h1 className="mt-3 max-w-xl font-display text-5xl leading-[1.02] md:text-7xl">L’élégance au quotidien</h1>
            <p className="mt-4 max-w-md text-[15px] text-white/90">Manteaux structurés, mailles douces et denim brut : les pièces de la saison sont arrivées.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/catalogue" className="btn-primary bg-white text-ink hover:bg-sand-100">Découvrir la collection <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/catalogue?promo=1" className="btn-secondary border-white bg-transparent text-white hover:bg-white/10">Voir les promotions</Link>
            </div>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {(['homme', 'femme'] as Category[]).map((c) => (
            <Link key={c} to={`/catalogue?categorie=${c}`} className="group relative min-h-[260px] overflow-hidden rounded-3xl md:min-h-[304px]">
              <ProductImage src={c === 'homme' ? IMG.heroMan : IMG.heroStore} alt={`Collection ${CATEGORY_LABELS[c]}`} fallbackLabel="" className="absolute inset-0 h-full w-full transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6 text-white">
                <p className="font-display text-4xl">{CATEGORY_LABELS[c]}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-sm">Explorer <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Réassurance */}
      <section className="container-page mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Truck, t: 'Livraison offerte', d: 'dès 60 € d’achat' },
          { icon: RotateCcw, t: 'Retours gratuits', d: 'sous 30 jours' },
          { icon: ShieldCheck, t: 'Paiement sécurisé', d: 'Stripe (bientôt) · démo simulée' },
        ].map(({ icon: Icon, t, d }) => (
          <div key={t} className="flex items-center gap-4 rounded-2xl bg-sand-50 px-5 py-4">
            <Icon className="h-6 w-6 flex-none" strokeWidth={1.5} aria-hidden="true" />
            <div><p className="text-sm font-semibold">{t}</p><p className="text-sm text-mist-500">{d}</p></div>
          </div>
        ))}
      </section>

      {/* Catégories */}
      <section className="container-page mt-20">
        <SectionHeader title="Nos catégories" kicker="Explorer" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {cats.map((c) => (
            <Link key={c} to={`/catalogue?categorie=${c}`} className="group relative overflow-hidden rounded-3xl">
              <ProductImage src={CATEGORY_IMAGES[c]} alt={CATEGORY_LABELS[c]} fallbackLabel="" className="aspect-[3/4] w-full transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between p-4 text-white md:p-5">
                <span className="font-display text-2xl md:text-3xl">{CATEGORY_LABELS[c]}</span>
                <span className="text-xs">{products.filter((p) => p.category === c).length} articles</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-page mt-20">
        <SectionHeader title="Nouveautés" kicker="Tout juste arrivé" to="/catalogue?tri=nouveautes" />
        <ProductGrid products={newest} />
      </section>

      <section className="container-page mt-20">
        <SectionHeader title="Meilleures ventes" kicker="Les préférés" to="/catalogue?tri=populaires" />
        <ProductGrid products={best} />
      </section>

      <section className="container-page mt-20">
        <div className="mb-8 flex flex-col justify-between gap-6 rounded-3xl bg-ink p-8 text-white md:flex-row md:items-center md:p-12">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-sand-200">Promotions</p>
            <h2 className="mt-2 font-display text-4xl md:text-5xl">Jusqu’à −30 % sur une sélection</h2>
            <p className="mt-3 text-sand-100">Et −10 % supplémentaires avec le code de démonstration <strong>BIENVENUE10</strong>.</p>
          </div>
          <Link to="/catalogue?promo=1" className="btn-primary flex-none bg-sand-200 text-ink hover:bg-sand-100">Voir les promotions</Link>
        </div>
        <ProductGrid products={promos} />
      </section>
    </div>
  );
}
