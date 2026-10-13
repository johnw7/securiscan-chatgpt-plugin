import { ShoppingBag } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { formatPrice } from '../lib/format';
import { computeTotals } from '../lib/pricing';

/** Barre panier fixe en bas d'écran sur mobile. */
export default function StickyCart() {
  const { cart, mode, promoCode, setCartOpen, cartOpen } = useStore();
  const { pathname } = useLocation();
  const t = computeTotals(cart, mode, promoCode);
  if (!t.count || cartOpen || pathname === '/commande') return null;
  return (
    <div className="fixed inset-x-3 bottom-3 z-40 sm:hidden">
      <button onClick={() => setCartOpen(true)} className="btn-red w-full justify-between text-base">
        <span className="flex items-center gap-2"><ShoppingBag className="h-5 w-5" /> Voir le panier ({t.count})</span>
        <span>{formatPrice(t.total)}</span>
      </button>
    </div>
  );
}
