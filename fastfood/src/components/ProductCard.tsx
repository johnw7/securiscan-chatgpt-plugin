import { Plus } from 'lucide-react';
import { TAG_LABELS } from '../data/menu';
import { formatPrice } from '../lib/format';
import type { Product } from '../types';
import Img from './Img';

export default function ProductCard({ product, onOpen }: { product: Product; onOpen: (p: Product) => void }) {
  const off = !product.available;
  return (
    <article className={`group flex animate-up flex-col overflow-hidden rounded-3xl bg-white shadow-[0_3px_0_rgba(23,17,14,.08)] ring-1 ring-ink/5 transition hover:-translate-y-1 hover:shadow-xl ${off ? 'opacity-60' : ''}`}>
      <button type="button" onClick={() => onOpen(product)} disabled={off} className="relative block text-left" aria-label={`${product.name}, ${formatPrice(product.price)}`}>
        <Img src={product.image} alt={product.name} className="aspect-square w-full transition duration-500 group-hover:scale-105" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {product.tags.map((t) => <span key={t} className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide ${TAG_LABELS[t].className}`}>{TAG_LABELS[t].label}</span>)}
        </div>
        {off && <span className="absolute inset-x-0 bottom-0 bg-ink/85 py-2 text-center text-sm font-bold text-cream">Victime de son succès</span>}
      </button>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-extrabold leading-tight">{product.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-ink/65">{product.description}</p>
        <div className="mt-auto flex items-center justify-between pt-4">
          <span className="text-xl font-extrabold">{formatPrice(product.price)}</span>
          <button type="button" onClick={() => onOpen(product)} disabled={off} aria-label={`Ajouter ${product.name}`}
            className="grid h-12 w-12 place-items-center rounded-full bg-tomato text-white shadow-[0_4px_0_#a8240f] transition hover:scale-110 active:translate-y-[2px] active:shadow-[0_2px_0_#a8240f] disabled:bg-ink/30 disabled:shadow-none">
            <Plus className="h-6 w-6" strokeWidth={3} />
          </button>
        </div>
      </div>
    </article>
  );
}
