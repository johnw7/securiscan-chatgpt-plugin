import { Heart, LogOut, MapPin, Package, Pencil, Plus, Trash2, User as UserIcon } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import DemoNotice from '../../components/DemoNotice';
import ProductGrid from '../../components/ProductGrid';
import StatusBadge from '../../components/StatusBadge';
import { useStore } from '../../context/StoreContext';
import { formatDate, formatPrice } from '../../lib/format';
import { uid } from '../../services/ids';
import type { Address } from '../../types';

const TABS = [
  { id: 'profil', label: 'Profil', icon: UserIcon },
  { id: 'commandes', label: 'Commandes', icon: Package },
  { id: 'favoris', label: 'Favoris', icon: Heart },
  { id: 'adresses', label: 'Adresses', icon: MapPin },
] as const;

const emptyAddress = (): Address => ({ id: uid(), label: '', firstName: '', lastName: '', street: '', postalCode: '', city: '', country: 'France', phone: '' });

export default function Account() {
  const { user, logout, orders, favorites, products, updateProfile, saveAddress, deleteAddress, notify } = useStore();
  const [params, setParams] = useSearchParams();
  const tab = params.get('onglet') ?? 'profil';
  const [editing, setEditing] = useState<Address | null>(null);

  if (!user) return <Navigate to="/connexion?retour=/compte" replace />;

  // En démo, on rattache les commandes par e-mail. En production : par user_id, filtré côté serveur (RLS).
  const myOrders = orders.filter((o) => o.email.toLowerCase() === user.email.toLowerCase());
  const favItems = products.filter((p) => favorites.includes(p.id));

  const saveProfile = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    updateProfile({ firstName: String(d.get('firstName')), lastName: String(d.get('lastName')), phone: String(d.get('phone')) });
    notify('Profil mis à jour');
  };

  const submitAddress = (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    saveAddress({ ...editing, label: editing.label || 'Adresse' });
    setEditing(null);
    notify('Adresse enregistrée');
  };

  return (
    <div className="container-page pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-mist-500">Mon compte</p>
          <h1 className="font-display text-4xl md:text-5xl">Bonjour {user.firstName}</h1>
        </div>
        <div className="flex gap-2">
          {user.role === 'admin' && <Link to="/admin" className="btn-secondary min-h-11">Administration</Link>}
          <button type="button" onClick={logout} className="btn-ghost"><LogOut className="h-4 w-4" /> Se déconnecter</button>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-8 lg:flex-row">
        <nav aria-label="Espace client" className="flex gap-2 overflow-x-auto lg:w-56 lg:flex-none lg:flex-col">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" onClick={() => setParams({ onglet: id })} aria-current={tab === id ? 'page' : undefined}
              className={`flex min-h-11 flex-none items-center gap-2 rounded-full px-4 text-sm transition ${tab === id ? 'bg-ink text-white' : 'hover:bg-mist-100'}`}>
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1">
          {tab === 'profil' && (
            <form onSubmit={saveProfile} className="card grid max-w-2xl gap-4 sm:grid-cols-2">
              <label className="field">Prénom<input name="firstName" defaultValue={user.firstName} className="input" required /></label>
              <label className="field">Nom<input name="lastName" defaultValue={user.lastName} className="input" required /></label>
              <label className="field">E-mail<input value={user.email} disabled className="input bg-mist-100 text-mist-500" /></label>
              <label className="field">Téléphone<input name="phone" defaultValue={user.phone} className="input" /></label>
              <div className="sm:col-span-2"><DemoNotice>Données de démonstration conservées uniquement dans cet onglet (non sécurisées, perdues au rechargement).</DemoNotice></div>
              <button className="btn-primary sm:col-span-2 sm:justify-self-start">Enregistrer</button>
            </form>
          )}

          {tab === 'commandes' && (
            myOrders.length ? (
              <div className="flex flex-col gap-4">
                {myOrders.map((o) => (
                  <article key={o.id} className="card">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold tracking-wide">{o.number}</p>
                        <p className="text-sm text-mist-500">{formatDate(o.createdAt)} · {o.lines.reduce((n, l) => n + l.quantity, 0)} article(s)</p>
                      </div>
                      <div className="flex items-center gap-3"><StatusBadge status={o.status} /><span className="font-semibold">{formatPrice(o.total)}</span></div>
                    </div>
                    <p className="mt-3 text-sm text-neutral-700">{o.lines.map((l) => `${l.quantity} × ${l.name} (${l.size})`).join(' · ')}</p>
                    <Link to={`/confirmation/${o.id}`} className="mt-3 inline-block text-sm underline">Voir le détail</Link>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl bg-sand-50 p-10 text-center">
                <p className="font-display text-2xl">Aucune commande</p>
                <p className="mt-2 text-sm text-mist-500">Vos commandes passées avec {user.email} apparaîtront ici.</p>
                <Link to="/catalogue" className="btn-primary mt-6">Découvrir la collection</Link>
              </div>
            )
          )}

          {tab === 'favoris' && (favItems.length ? <ProductGrid products={favItems} /> : <p className="text-mist-500">Aucun favori pour l’instant.</p>)}

          {tab === 'adresses' && (
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                {user.addresses.map((a) => (
                  <div key={a.id} className="card text-sm">
                    <p className="font-semibold">{a.label}</p>
                    <p className="mt-2 text-neutral-700">{a.firstName} {a.lastName}<br />{a.street}<br />{a.postalCode} {a.city}, {a.country}<br />{a.phone}</p>
                    <div className="mt-4 flex gap-2">
                      <button type="button" onClick={() => setEditing(a)} className="btn-ghost"><Pencil className="h-4 w-4" /> Modifier</button>
                      <button type="button" onClick={() => deleteAddress(a.id)} className="btn-ghost text-red-700"><Trash2 className="h-4 w-4" /> Supprimer</button>
                    </div>
                  </div>
                ))}
              </div>
              {!editing && (
                <button type="button" onClick={() => setEditing({ ...emptyAddress(), firstName: user.firstName, lastName: user.lastName, phone: user.phone })} className="btn-secondary self-start">
                  <Plus className="h-4 w-4" /> Ajouter une adresse
                </button>
              )}
              {editing && (
                <form onSubmit={submitAddress} className="card grid gap-4 sm:grid-cols-2">
                  {([['label', 'Nom de l’adresse (ex. Domicile)'], ['firstName', 'Prénom'], ['lastName', 'Nom'], ['street', 'Adresse'], ['postalCode', 'Code postal'], ['city', 'Ville'], ['country', 'Pays'], ['phone', 'Téléphone']] as const).map(([k, label]) => (
                    <label key={k} className={`field ${k === 'street' ? 'sm:col-span-2' : ''}`}>
                      {label}
                      <input value={editing[k]} onChange={(e) => setEditing({ ...editing, [k]: e.target.value })} className="input" required={k !== 'label' && k !== 'phone'} />
                    </label>
                  ))}
                  <div className="flex gap-3 sm:col-span-2">
                    <button className="btn-primary">Enregistrer</button>
                    <button type="button" onClick={() => setEditing(null)} className="btn-secondary">Annuler</button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
