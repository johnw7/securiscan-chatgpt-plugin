import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { discountPercent, formatPrice } from '../lib/format';
import type { Product } from '../types';
import ProductImage from './ProductImage';

const isNew = (p: Product) => Date.now() - new Date(p.createdAt).getTime() < 1000 * 60 * 60 * 24 * 21;

export default function ProductCard({ product }: { product: Product }) {
  const { isFavorite, toggleFavorite } = useStore();
  const fav = isFavorite(product.id);
  const pct = discountPercent(product.price, product.compareAtPrice);
  const badge = product.stock === 0 ? 'Épuisé' : pct ? `−${pct} %` : isNew(product) ? 'Nouveau' : null;

  return (
    <article className="group animate-fade-up">
      <div className="relative">
        <Link to={`/produit/${product.id}`} className="block overflow-hidden rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink">
          <ProductImage
            src={product.images[0]}
            alt={product.name}
            fallbackLabel={product.type}
            className="aspect-[3/4] w-full transition duration-500 group-hover:scale-[1.03]"
          />
          {product.images[1] && (
            <ProductImage
              src={product.images[1]}
              alt=""
              fallbackLabel={product.type}
              className="pointer-events-none absolute inset-0 hidden aspect-[3/4] w-full opacity-0 transition duration-500 group-hover:opacity-100 md:block"
            />
          )}
        </Link>
        {badge && (
          <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-wider ${product.stock === 0 ? 'bg-ink text-white' : 'bg-white text-ink'}`}>
            {badge}
          </span>
        )}
        <button
          type="button"
          onClick={() => toggleFavorite(product.id)}
          aria-label={fav ? `Retirer ${product.name} des favoris` : `Ajouter ${product.name} aux favoris`}
          aria-pressed={fav}
          className="absolute right-2 top-2 grid h-11 w-11 place-items-center rounded-full bg-white/90 transition hover:scale-105"
        >
          <Heart className={`h-[18px] w-[18px] ${fav ? 'fill-ink' : ''}`} strokeWidth={1.6} />
        </button>
      </div>
      <Link to={`/produit/${product.id}`} className="mt-3 block">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm">{product.name}</h3>
          <div className="text-right">
            <p className="whitespace-nowrap text-sm font-semibold">{formatPrice(product.price)}</p>
            {pct > 0 && <p className="text-xs text-mist-500 line-through">{formatPrice(product.compareAtPrice!)}</p>}
          </div>
        </div>
        <p className="mt-1 text-xs text-mist-500">
          {product.colors.length} coloris
          {product.stock > 0 && product.stock < 10 && <span className="text-amber-800"> · Plus que {product.stock}</span>}
        </p>
      </Link>
    </article>
  );
}
