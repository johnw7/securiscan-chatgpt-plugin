import { LogOut } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { formatPrice } from '../lib/format';
import { MODE_LABELS, STATUS_LABELS, STATUS_STYLES } from '../lib/orders';

export default function Account() {
  const { user, logout, orders } = useStore();
  if (!user) return <Navigate to="/connexion?retour=/compte" replace />;
  const mine = orders.filter((o) => o.customer.email.toLowerCase() === user.email.toLowerCase());
  return (
    <div className="wrap max-w-3xl pt-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="label">Mon compte</p><h1 className="h-display text-6xl">Salut {user.name.split(' ')[0]} !</h1></div>
        <div className="flex gap-2">
          {user.role === 'admin' && <Link to="/admin" className="btn-yellow min-h-11">Espace gérant</Link>}
          <button onClick={logout} className="btn-ghost min-h-11"><LogOut className="h-4 w-4" /> Déconnexion</button>
        </div>
      </div>
      <div className="card mt-8 grid gap-2 text-sm sm:grid-cols-2">
        <p><b>E-mail :</b> {user.email}</p>
        <p><b>Téléphone :</b> {user.phone || '—'}</p>
        {user.address && <p className="sm:col-span-2"><b>Adresse :</b> {user.address.street}, {user.address.postalCode} {user.address.city}</p>}
      </div>
      <h2 className="h-display mt-10 text-4xl">Mes commandes</h2>
      {mine.length ? (
        <div className="mt-4 space-y-3">
          {mine.map((o) => (
            <Link key={o.id} to={`/suivi/${o.id}`} className="card flex flex-wrap items-center justify-between gap-3 hover:ring-ink/30">
              <div><p className="font-extrabold">{o.number}</p><p className="text-sm text-ink/60">{MODE_LABELS[o.mode]} · {o.lines.reduce((n, l) => n + l.quantity, 0)} article(s)</p></div>
              <div className="flex items-center gap-3"><span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[o.status]}`}>{STATUS_LABELS[o.status]}</span><b>{formatPrice(o.total)}</b></div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-3xl bg-white p-8 text-center"><p className="font-semibold">Pas encore de commande.</p><Link to="/menu" className="btn-red mt-4">Je commande</Link></div>
      )}
    </div>
  );
}
