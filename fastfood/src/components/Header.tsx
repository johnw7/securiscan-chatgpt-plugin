import { Menu as MenuIcon, ShoppingBag, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { BRAND } from '../data/menu';
import { formatPrice } from '../lib/format';
import { computeTotals } from '../lib/pricing';

const NAV = [
  { to: '/menu', label: 'La carte' },
  { to: '/menu#menus', label: 'Menus' },
  { to: '/suivi', label: 'Suivre ma commande' },
  { to: '/#infos', label: 'Infos & horaires' },
];

export default function Header() {
  const { cart, mode, setCartOpen, user } = useStore();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const t = computeTotals(cart, mode);
  useEffect(() => setOpen(false), [loc]);

  return (
    <header className="sticky top-0 z-40 bg-ink text-cream">
      <div className="overflow-hidden bg-mustard py-1.5 text-ink">
        <div className="flex w-max animate-marquee gap-10 whitespace-nowrap text-xs font-extrabold uppercase tracking-wider">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex gap-10" aria-hidden={k === 1}>
              <span>🔥 Code SMASH10 : −10 % sur votre commande</span>
              <span>🛵 Livraison offerte dès 25 €</span>
              <span>🍟 Frites maison coupées chaque matin</span>
              <span>⏱ Prêt en 15 min à emporter</span>
            </div>
          ))}
        </div>
      </div>
      <div className="wrap flex items-center gap-4 py-3">
        <button className="grid h-11 w-11 place-items-center rounded-full lg:hidden" aria-label="Ouvrir le menu" onClick={() => setOpen(true)}>
          <MenuIcon className="h-6 w-6" />
        </button>
        <Link to="/" className="h-display text-[28px] text-mustard sm:text-3xl" aria-label={`${BRAND.name}, accueil`}>
          SMASH<span className="text-cream">HOUSE</span>
        </Link>
        <nav aria-label="Navigation principale" className="ml-6 hidden gap-1 lg:flex">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className="rounded-full px-4 py-2.5 text-sm font-bold text-cream/85 transition hover:bg-white/10 hover:text-cream">{n.label}</NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link to={user ? (user.role === 'admin' ? '/admin' : '/compte') : '/connexion'} aria-label={user ? 'Mon compte' : 'Se connecter'} className="grid h-11 w-11 place-items-center rounded-full hover:bg-white/10">
            <User className="h-5 w-5" />
          </Link>
          <button type="button" onClick={() => setCartOpen(true)} aria-label={`Panier : ${t.count} article${t.count > 1 ? 's' : ''}`}
            className="flex min-h-11 items-center gap-2 rounded-full bg-tomato px-4 font-extrabold text-white transition hover:brightness-110">
            <ShoppingBag className="h-5 w-5" />
            <span key={t.count} className="animate-pop">{t.count}</span>
            {t.count > 0 && <span className="hidden border-l border-white/30 pl-2 sm:inline">{formatPrice(t.total)}</span>}
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-black/60" aria-label="Fermer" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[84%] max-w-sm animate-up flex-col bg-ink p-6">
            <div className="mb-8 flex items-center justify-between">
              <span className="h-display text-3xl text-mustard">SMASH<span className="text-cream">HOUSE</span></span>
              <button className="grid h-11 w-11 place-items-center rounded-full" aria-label="Fermer" onClick={() => setOpen(false)}><X className="h-6 w-6" /></button>
            </div>
            {NAV.map((n) => <Link key={n.to} to={n.to} className="h-display py-3 text-4xl">{n.label}</Link>)}
            <div className="mt-auto border-t border-white/10 pt-4 text-sm text-cream/70">
              <Link to={user ? '/compte' : '/connexion'} className="block py-2">{user ? 'Mon compte' : 'Se connecter'}</Link>
              <Link to="/admin" className="block py-2">Espace gérant</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
