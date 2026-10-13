import { Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

const NAV = [
  { to: '/catalogue?categorie=femme', label: 'Femme' },
  { to: '/catalogue?categorie=homme', label: 'Homme' },
  { to: '/catalogue?categorie=enfant', label: 'Enfant' },
  { to: '/catalogue?categorie=accessoires', label: 'Accessoires' },
  { to: '/catalogue?promo=1', label: 'Promotions' },
];

function Badge({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span className="absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-ink px-1 text-[11px] font-semibold text-white">
      {n > 99 ? '99+' : n}
    </span>
  );
}

export default function Header() {
  const { cart, favorites, user } = useStore();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const count = cart.reduce((n, i) => n + i.quantity, 0);

  useEffect(() => setOpen(false), [location]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate(q.trim() ? `/catalogue?q=${encodeURIComponent(q.trim())}` : '/catalogue');
  };

  const isActive = (to: string) => location.pathname + location.search === to;

  return (
    <header className="sticky top-0 z-40 border-b border-mist-200 bg-white/95 backdrop-blur">
      <div className="bg-ink px-4 py-2 text-center text-[11px] uppercase tracking-[0.12em] text-sand-100 sm:text-xs">
        Livraison offerte dès 60 €<span className="hidden sm:inline"> · Retours gratuits 30 jours</span> · Code démo <strong>BIENVENUE10</strong>
      </div>
      <div className="container-page flex flex-wrap items-center gap-x-2 gap-y-3 py-3 sm:gap-x-6">
        <button className="-ml-2 grid h-11 w-11 place-items-center rounded-full lg:hidden" aria-label="Ouvrir le menu" aria-expanded={open} onClick={() => setOpen(true)}>
          <Menu className="h-6 w-6" strokeWidth={1.6} />
        </button>
        <Link to="/" className="font-display text-[22px] font-semibold tracking-[0.14em] sm:text-[28px] sm:tracking-[0.16em]">STYLESHOP</Link>

        <nav aria-label="Navigation principale" className="hidden gap-1 lg:flex">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className={() => `btn-ghost ${isActive(n.to) ? 'bg-mist-100 font-semibold' : ''}`}>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="-mr-2 ml-auto flex items-center lg:order-last">
          <Link to={user ? '/compte' : '/connexion'} className="relative grid h-11 w-11 place-items-center rounded-full hover:bg-mist-100" aria-label={user ? 'Mon compte' : 'Se connecter'}>
            <User className="h-[22px] w-[22px]" strokeWidth={1.6} />
          </Link>
          <Link to="/favoris" className="relative grid h-11 w-11 place-items-center rounded-full hover:bg-mist-100" aria-label={`Favoris (${favorites.length})`}>
            <Heart className="h-[22px] w-[22px]" strokeWidth={1.6} />
            <Badge n={favorites.length} />
          </Link>
          <Link to="/panier" className="relative grid h-11 w-11 place-items-center rounded-full hover:bg-mist-100" aria-label={`Panier (${count} article${count > 1 ? 's' : ''})`}>
            <ShoppingBag className="h-[22px] w-[22px]" strokeWidth={1.6} />
            <Badge n={count} />
          </Link>
        </div>

        <form onSubmit={submit} role="search" className="order-last flex min-h-11 w-full items-center gap-2 rounded-full bg-mist-100 px-4 lg:order-none lg:w-auto lg:flex-1">
          <Search className="h-[18px] w-[18px] text-mist-500" aria-hidden="true" />
          <label htmlFor="search" className="sr-only">Rechercher un vêtement</label>
          <input id="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un vêtement, une couleur…" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
        </form>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-black/30" aria-label="Fermer le menu" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[82%] max-w-sm animate-fade-up flex-col gap-1 bg-white p-6">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-display text-2xl font-semibold tracking-[0.16em]">STYLESHOP</span>
              <button className="grid h-11 w-11 place-items-center rounded-full" aria-label="Fermer le menu" onClick={() => setOpen(false)}><X className="h-6 w-6" /></button>
            </div>
            <Link to="/catalogue" className="py-3 font-display text-2xl">Toute la collection</Link>
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className="py-3 font-display text-2xl">{n.label}</Link>
            ))}
            <div className="mt-auto flex flex-col gap-2 border-t border-mist-200 pt-4 text-sm">
              <Link to={user ? '/compte' : '/connexion'} className="py-2">{user ? 'Mon compte' : 'Se connecter / Créer un compte'}</Link>
              <Link to="/admin" className="py-2">Espace administrateur</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
