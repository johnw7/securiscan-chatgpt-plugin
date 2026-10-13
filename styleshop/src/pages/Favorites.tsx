import { Heart } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import ProductGrid from '../components/ProductGrid';
import { useStore } from '../context/StoreContext';

export default function Favorites() {
  const { favorites, products } = useStore();
  const items = products.filter((p) => favorites.includes(p.id));
  return (
    <div className="container-page pt-10">
      <h1 className="font-display text-4xl md:text-5xl">Mes favoris</h1>
      <p className="mb-8 mt-1 text-sm text-mist-500">{items.length} article{items.length > 1 ? 's' : ''} · enregistrés sur cet appareil</p>
      {items.length ? <ProductGrid products={items} /> : <EmptyState icon={Heart} title="Aucun favori pour l’instant" text="Touchez le cœur d’un article pour le retrouver ici." />}
    </div>
  );
}
