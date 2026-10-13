import { ChevronLeft, Heart, RotateCcw, ShoppingBag, Truck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ProductGrid from '../components/ProductGrid';
import ProductImage from '../components/ProductImage';
import QuantitySelector from '../components/QuantitySelector';
import Stars from '../components/Stars';
import { useStore } from '../context/StoreContext';
import { CATEGORY_LABELS } from '../data/products';
import { averageRating, discountPercent, formatDate, formatPrice } from '../lib/format';
import { ALL_SIZES, type Size } from '../types';

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getProduct, products, addToCart, toggleFavorite, isFavorite, notify } = useStore();
  const product = getProduct(id ?? '');

  const [image, setImage] = useState(0);
  const [size, setSize] = useState<Size | null>(null);
  const [color, setColor] = useState('');
  const [qty, setQty] = useState(1);
  const [sizeError, setSizeError] = useState(false);

  useEffect(() => {
    setImage(0);
    setSize(product?.sizes.length === 1 ? product.sizes[0] : null);
    setColor(product?.colors[0]?.name ?? '');
    setQty(1);
    setSizeError(false);
  }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!product) {
    return (
      <div className="container-page py-24 text-center">
        <p className="font-display text-3xl">Article introuvable</p>
        <Link to="/catalogue" className="btn-primary mt-6">Retour au catalogue</Link>
      </div>
    );
  }

  const pct = discountPercent(product.price, product.compareAtPrice);
  const rating = averageRating(product.reviews.map((r) => r.rating));
  const fav = isFavorite(product.id);
  const outOfStock = product.stock === 0;
  const similar = [
    ...products.filter((p) => p.id !== product.id && p.category === product.category && p.type === product.type),
    ...products.filter((p) => p.id !== product.id && p.category === product.category && p.type !== product.type),
  ].slice(0, 4);

  const add = () => {
    if (!size) {
      setSizeError(true);
      return;
    }
    addToCart({ productId: product.id, size, color, quantity: qty });
    notify(`${product.name} (${size}, ${color}) ajouté au panier`);
  };

  return (
    <div className="container-page pt-6">
      <button type="button" onClick={() => navigate(-1)} className="btn-ghost -ml-3 text-mist-500">
        <ChevronLeft className="h-4 w-4" /> Retour
      </button>
      <p className="mt-1 text-sm text-mist-500">
        <Link to="/" className="hover:underline">Accueil</Link> / <Link to={`/catalogue?categorie=${product.category}`} className="hover:underline">{CATEGORY_LABELS[product.category]}</Link> / {product.type}
      </p>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        {/* Galerie */}
        <div className="flex flex-col-reverse gap-3 md:flex-row">
          <div className="flex gap-3 md:flex-col" role="tablist" aria-label="Photos du produit">
            {product.images.map((src, i) => (
              <button key={src + i} type="button" role="tab" aria-selected={image === i} aria-label={`Photo ${i + 1}`} onClick={() => setImage(i)}
                className={`w-20 overflow-hidden rounded-xl transition ${image === i ? 'ring-2 ring-ink ring-offset-2' : 'opacity-70 hover:opacity-100'}`}>
                <ProductImage src={src} alt="" fallbackLabel={`${i + 1}`} className="aspect-[3/4] w-full" />
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <ProductImage key={product.images[image]} src={product.images[image]} alt={`${product.name} — photo ${image + 1}`} fallbackLabel={product.type} eager className="aspect-[4/5] w-full animate-fade-up rounded-3xl" />
            {pct > 0 && <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-semibold">−{pct} %</span>}
          </div>
        </div>

        {/* Infos */}
        <div className="flex flex-col gap-6 lg:max-w-lg">
          <div>
            <p className="text-sm text-mist-500">{CATEGORY_LABELS[product.category]} · {product.type}</p>
            <h1 className="mt-1 font-display text-4xl leading-tight md:text-5xl">{product.name}</h1>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-2xl font-semibold">{formatPrice(product.price)}</span>
              {pct > 0 && <span className="text-lg text-mist-500 line-through">{formatPrice(product.compareAtPrice!)}</span>}
            </div>
            <a href="#avis" className="mt-2 inline-flex items-center gap-2 text-sm text-mist-500 hover:underline">
              <Stars value={rating} /> {rating} · {product.reviews.length} avis de démonstration
            </a>
          </div>

          <p className="text-[15px] leading-relaxed text-neutral-700">{product.description}</p>

          <div>
            <p className="mb-3 text-sm font-semibold">Couleur : <span className="font-normal">{color}</span></p>
            <div className="flex flex-wrap gap-3">
              {product.colors.map((c) => (
                <button key={c.name} type="button" aria-label={c.name} title={c.name} aria-pressed={color === c.name} onClick={() => setColor(c.name)}
                  className={`h-10 w-10 rounded-full border border-mist-300 transition ${color === c.name ? 'ring-2 ring-ink ring-offset-2' : 'hover:scale-110'}`} style={{ background: c.hex }} />
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Taille{size ? ` : ${size}` : ''}</p>
              <span className="text-xs text-mist-500">Tailles barrées : indisponibles</span>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {ALL_SIZES.map((s) => {
                const ok = product.sizes.includes(s);
                return (
                  <button key={s} type="button" disabled={!ok} aria-pressed={size === s} onClick={() => { setSize(s); setSizeError(false); }}
                    className={`min-h-12 rounded-xl border text-sm transition ${size === s ? 'border-ink bg-ink text-white' : ok ? 'border-mist-300 hover:border-ink' : 'cursor-not-allowed border-mist-200 bg-mist-100 text-mist-500 line-through'}`}>
                    {s}
                  </button>
                );
              })}
            </div>
            {sizeError && <p className="mt-2 text-sm text-red-700" role="alert">Veuillez choisir une taille.</p>}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <QuantitySelector value={qty} max={Math.max(1, Math.min(10, product.stock))} onChange={setQty} />
            <span className={`text-sm ${outOfStock ? 'text-red-700' : product.stock < 10 ? 'text-amber-800' : 'text-green-800'}`}>
              {outOfStock ? 'Rupture de stock' : product.stock < 10 ? `Plus que ${product.stock} en stock` : 'En stock'}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={add} disabled={outOfStock} className="btn-primary">
              <ShoppingBag className="h-[18px] w-[18px]" /> {outOfStock ? 'Indisponible' : 'Ajouter au panier'}
            </button>
            <button type="button" onClick={() => toggleFavorite(product.id)} aria-pressed={fav} className="btn-secondary">
              <Heart className={`h-[18px] w-[18px] ${fav ? 'fill-ink' : ''}`} /> {fav ? 'Dans vos favoris' : 'Ajouter aux favoris'}
            </button>
          </div>

          <ul className="space-y-1.5 border-t border-mist-200 pt-5 text-sm text-neutral-700">
            {product.details.map((d) => <li key={d}>· {d}</li>)}
          </ul>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <p className="flex items-center gap-2"><Truck className="h-4 w-4" /> Livraison offerte dès 60 €</p>
            <p className="flex items-center gap-2"><RotateCcw className="h-4 w-4" /> Retours gratuits 30 jours</p>
          </div>
        </div>
      </div>

      <section id="avis" className="mt-20 scroll-mt-32">
        <h2 className="font-display text-3xl">Avis clients</h2>
        <p className="mt-1 text-sm text-mist-500">Avis de démonstration, fictifs — aucun client réel.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {product.reviews.map((r, i) => (
            <figure key={i} className="card">
              <div className="flex items-center justify-between">
                <Stars value={r.rating} />
                <span className="rounded-full bg-mist-100 px-2 py-0.5 text-[11px] uppercase tracking-wider text-mist-500">Démo</span>
              </div>
              <blockquote className="mt-3 text-[15px]">« {r.comment} »</blockquote>
              <figcaption className="mt-3 text-xs text-mist-500">{r.author} · {formatDate(r.date)}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {similar.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 font-display text-3xl">Vous aimerez aussi</h2>
          <ProductGrid products={similar} />
        </section>
      )}
    </div>
  );
}
