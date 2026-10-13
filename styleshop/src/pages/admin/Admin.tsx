import { AlertTriangle, BarChart3, Boxes, Package, Pencil, Plus, Search, ShieldAlert, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import DemoNotice from '../../components/DemoNotice';
import ProductImage from '../../components/ProductImage';
import StatusBadge from '../../components/StatusBadge';
import { useStore } from '../../context/StoreContext';
import { CATEGORY_LABELS } from '../../data/products';
import { formatDate, formatPrice } from '../../lib/format';
import { STATUS_FLOW, STATUS_LABELS } from '../../lib/orders';
import type { Category, OrderStatus, Product } from '../../types';
import ProductForm from './ProductForm';

const TABS = [
  { id: 'stats', label: 'Tableau de bord', icon: BarChart3 },
  { id: 'produits', label: 'Produits', icon: Boxes },
  { id: 'commandes', label: 'Commandes', icon: Package },
] as const;

export default function Admin() {
  const { user, products, orders, upsertProduct, deleteProduct, setOrderStatus, notify } = useStore();
  const [params, setParams] = useSearchParams();
  const tab = params.get('onglet') ?? 'stats';
  const [editing, setEditing] = useState<Product | 'new' | null>(null);
  const [q, setQ] = useState('');

  const stats = useMemo(() => {
    // Statistiques de DÉMONSTRATION : ventes historiques fictives (champ `sold`) + commandes de la session.
    const revenue = products.reduce((s, p) => s + p.sold * p.price, 0);
    const units = products.reduce((s, p) => s + p.sold, 0);
    const byCat = (Object.keys(CATEGORY_LABELS) as Category[]).map((c) => ({
      c, value: products.filter((p) => p.category === c).reduce((s, p) => s + p.sold * p.price, 0),
    }));
    const max = Math.max(...byCat.map((b) => b.value), 1);
    const top = [...products].sort((a, b) => b.sold * b.price - a.sold * a.price).slice(0, 5);
    const lowStock = products.filter((p) => p.stock < 6).sort((a, b) => a.stock - b.stock);
    const sessionRevenue = orders.filter((o) => o.status !== 'annulee').reduce((s, o) => s + o.total, 0);
    return { revenue, units, byCat, max, top, lowStock, sessionRevenue };
  }, [products, orders]);

  if (!user) return <Navigate to="/connexion?retour=/admin" replace />;
  if (user.role !== 'admin') {
    return (
      <div className="container-page max-w-xl py-24 text-center">
        <ShieldAlert className="mx-auto h-10 w-10" strokeWidth={1.4} />
        <h1 className="mt-4 font-display text-3xl">Accès réservé</h1>
        <p className="mt-2 text-mist-500">Cet espace est réservé au propriétaire de la boutique. Compte de test : <code>admin@styleshop.demo</code> / <code>admin1234</code>.</p>
        <Link to="/" className="btn-primary mt-6">Retour à la boutique</Link>
      </div>
    );
  }

  const filtered = products.filter((p) => `${p.name} ${p.type}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="container-page pt-10">
      <p className="text-sm text-mist-500">Administration</p>
      <h1 className="font-display text-4xl md:text-5xl">Gestion de la boutique</h1>
      <div className="mt-4">
        <DemoNotice>
          <strong>Mode démonstration.</strong> Le contrôle d’accès ci-dessus est uniquement côté navigateur et les modifications sont perdues au rechargement.
          Avant toute mise en production : authentification Supabase, rôle <code>admin</code> vérifié côté serveur et politiques RLS (voir <code>supabase/schema.sql</code>).
        </DemoNotice>
      </div>

      <nav aria-label="Administration" className="mt-6 flex gap-2 overflow-x-auto border-b border-mist-200 pb-3">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" onClick={() => setParams({ onglet: id })} aria-current={tab === id ? 'page' : undefined}
            className={`flex min-h-11 flex-none items-center gap-2 rounded-full px-4 text-sm transition ${tab === id ? 'bg-ink text-white' : 'hover:bg-mist-100'}`}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </nav>

      {tab === 'stats' && (
        <div className="mt-8 flex flex-col gap-8">
          <p className="text-sm text-mist-500">Chiffres de démonstration (ventes fictives).</p>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { l: 'Chiffre d’affaires (démo)', v: formatPrice(stats.revenue) },
              { l: 'Articles vendus (démo)', v: stats.units.toLocaleString('fr-FR') },
              { l: 'Commandes cette session', v: `${orders.length} · ${formatPrice(stats.sessionRevenue)}` },
              { l: 'Produits en stock faible', v: String(stats.lowStock.length) },
            ].map((k) => (
              <div key={k.l} className="card p-5">
                <p className="text-xs text-mist-500">{k.l}</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums">{k.v}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="card">
              <h2 className="label-caps">Ventes par catégorie (démo)</h2>
              <div className="mt-5 flex flex-col gap-4">
                {stats.byCat.map((b) => (
                  <div key={b.c}>
                    <div className="mb-1 flex justify-between text-sm"><span>{CATEGORY_LABELS[b.c]}</span><span className="tabular-nums">{formatPrice(b.value)}</span></div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-mist-100"><div className="h-full rounded-full bg-ink" style={{ width: `${(b.value / stats.max) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            </section>
            <section className="card">
              <h2 className="label-caps">Meilleurs produits (démo)</h2>
              <ol className="mt-4 divide-y divide-mist-200">
                {stats.top.map((p, i) => (
                  <li key={p.id} className="flex items-center gap-3 py-2.5 text-sm">
                    <span className="w-5 text-mist-500">{i + 1}</span>
                    <span className="flex-1">{p.name}</span>
                    <span className="text-mist-500">{p.sold} ventes</span>
                    <span className="w-24 text-right font-medium tabular-nums">{formatPrice(p.sold * p.price)}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>
          {stats.lowStock.length > 0 && (
            <section className="card">
              <h2 className="label-caps flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Stock faible</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {stats.lowStock.map((p) => (
                  <li key={p.id}><button type="button" onClick={() => { setParams({ onglet: 'produits' }); setEditing(p); }} className="chip chip-off">{p.name} · {p.stock}</button></li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {tab === 'produits' && (
        <div className="mt-8">
          {editing ? (
            <ProductForm
              initial={editing === 'new' ? undefined : editing}
              onCancel={() => setEditing(null)}
              onSave={(p) => { upsertProduct(p); setEditing(null); notify(editing === 'new' ? 'Produit ajouté' : 'Produit modifié'); }}
            />
          ) : (
            <>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <label className="flex min-h-11 flex-1 items-center gap-2 rounded-full bg-mist-100 px-4 sm:max-w-sm">
                  <Search className="h-4 w-4 text-mist-500" />
                  <span className="sr-only">Rechercher un produit</span>
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un produit…" className="flex-1 bg-transparent text-sm outline-none" />
                </label>
                <button type="button" onClick={() => setEditing('new')} className="btn-primary min-h-11"><Plus className="h-4 w-4" /> Ajouter un vêtement</button>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-mist-200">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="bg-mist-50 text-left text-xs uppercase tracking-wider text-mist-500">
                    <tr><th className="p-3">Produit</th><th className="p-3">Catégorie</th><th className="p-3">Prix (€)</th><th className="p-3">Stock</th><th className="p-3 text-right">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-mist-200">
                    {filtered.map((p) => (
                      <tr key={p.id}>
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <ProductImage src={p.images[0]} alt="" fallbackLabel="" className="h-14 w-11 flex-none rounded-lg" />
                            <div><p className="font-medium">{p.name}</p><p className="text-xs text-mist-500">{p.type}</p></div>
                          </div>
                        </td>
                        <td className="p-3">{CATEGORY_LABELS[p.category]}</td>
                        <td className="p-3">
                          <label className="sr-only" htmlFor={`price-${p.id}`}>Prix de {p.name}</label>
                          <input id={`price-${p.id}`} type="number" min="0" step="0.01" defaultValue={(p.price / 100).toFixed(2)}
                            onBlur={(e) => { const v = Math.round(parseFloat(e.target.value) * 100); if (v > 0 && v !== p.price) { upsertProduct({ ...p, price: v }); notify('Prix mis à jour'); } }}
                            className="input min-h-10 w-28 px-3" />
                        </td>
                        <td className="p-3">
                          <label className="sr-only" htmlFor={`stock-${p.id}`}>Stock de {p.name}</label>
                          <input id={`stock-${p.id}`} type="number" min="0" step="1" defaultValue={p.stock}
                            onBlur={(e) => { const v = Math.max(0, parseInt(e.target.value, 10) || 0); if (v !== p.stock) { upsertProduct({ ...p, stock: v }); notify('Stock mis à jour'); } }}
                            className={`input min-h-10 w-24 px-3 ${p.stock === 0 ? 'border-red-400' : p.stock < 6 ? 'border-amber-400' : ''}`} />
                        </td>
                        <td className="p-3">
                          <div className="flex justify-end gap-1">
                            <button type="button" onClick={() => setEditing(p)} className="btn-ghost"><Pencil className="h-4 w-4" /> Modifier</button>
                            <button type="button" onClick={() => { if (window.confirm(`Supprimer « ${p.name} » ?`)) { deleteProduct(p.id); notify('Produit supprimé'); } }} className="btn-ghost text-red-700">
                              <Trash2 className="h-4 w-4" /> <span className="sr-only">Supprimer {p.name}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-mist-500">{products.length} produits · prix et stock enregistrés en quittant le champ.</p>
            </>
          )}
        </div>
      )}

      {tab === 'commandes' && (
        <div className="mt-8">
          {orders.length ? (
            <div className="overflow-x-auto rounded-2xl border border-mist-200">
              <table className="w-full min-w-[820px] text-sm">
                <thead className="bg-mist-50 text-left text-xs uppercase tracking-wider text-mist-500">
                  <tr><th className="p-3">N°</th><th className="p-3">Date</th><th className="p-3">Client</th><th className="p-3">Articles</th><th className="p-3">Total</th><th className="p-3">Paiement</th><th className="p-3">Statut</th></tr>
                </thead>
                <tbody className="divide-y divide-mist-200">
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td className="p-3 font-medium"><Link to={`/confirmation/${o.id}`} className="hover:underline">{o.number}</Link></td>
                      <td className="p-3">{formatDate(o.createdAt)}</td>
                      <td className="p-3">{o.customer.firstName} {o.customer.lastName}<br /><span className="text-xs text-mist-500">{o.email}</span></td>
                      <td className="p-3">{o.lines.reduce((n, l) => n + l.quantity, 0)}</td>
                      <td className="p-3 font-medium">{formatPrice(o.total)}</td>
                      <td className="p-3 text-xs">{o.paymentMode === 'simule' ? 'Simulé (démo)' : 'Stripe'}</td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1.5">
                          <StatusBadge status={o.status} />
                          <label className="sr-only" htmlFor={`st-${o.id}`}>Statut de {o.number}</label>
                          <select id={`st-${o.id}`} value={o.status} onChange={(e) => { setOrderStatus(o.id, e.target.value as OrderStatus); notify('Statut mis à jour'); }} className="min-h-10 rounded-lg border border-mist-300 bg-white px-2 text-sm">
                            {STATUS_FLOW.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-3xl bg-sand-50 p-10 text-center">
              <p className="font-display text-2xl">Aucune commande pour l’instant</p>
              <p className="mt-2 text-sm text-mist-500">Passez une commande test depuis la boutique : elle apparaîtra ici (session en cours uniquement).</p>
            </div>
          )}
          <p className="mt-3 text-xs text-mist-500">« Payée » ne doit être posé automatiquement que par le webhook Stripe en production, jamais par le navigateur.</p>
        </div>
      )}
    </div>
  );
}
