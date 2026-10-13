import { BarChart3, ClipboardList, Plus, ShieldAlert, Trash2, UtensilsCrossed } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import DemoNotice from '../components/DemoNotice';
import Img from '../components/Img';
import { useStore } from '../context/StoreContext';
import { CATEGORIES } from '../data/menu';
import { describe } from '../lib/describe';
import { formatPrice } from '../lib/format';
import { MODE_LABELS, STATUS_LABELS, STATUS_STYLES } from '../lib/orders';
import type { CategoryId, OrderStatus, Product } from '../types';

const TABS = [
  { id: 'commandes', label: 'Commandes', icon: ClipboardList },
  { id: 'carte', label: 'La carte', icon: UtensilsCrossed },
  { id: 'stats', label: 'Statistiques', icon: BarChart3 },
] as const;

const COLUMNS: OrderStatus[] = ['recue', 'preparation', 'prete', 'livraison', 'terminee'];
const NEXT: Partial<Record<OrderStatus, OrderStatus>> = { recue: 'preparation', preparation: 'prete', prete: 'terminee', livraison: 'terminee' };

export default function Admin() {
  const { user, orders, setOrderStatus, products, upsertProduct, deleteProduct, notify } = useStore();
  const [params, setParams] = useSearchParams();
  const tab = params.get('onglet') ?? 'commandes';
  const [adding, setAdding] = useState(false);

  const stats = useMemo(() => {
    const revenue = products.reduce((s, p) => s + p.sold * p.price, 0);
    const units = products.reduce((s, p) => s + p.sold, 0);
    const byCat = CATEGORIES.map((c) => ({ label: c.label, v: products.filter((p) => p.category === c.id).reduce((s, p) => s + p.sold * p.price, 0) }));
    const max = Math.max(...byCat.map((b) => b.v), 1);
    const top = [...products].sort((a, b) => b.sold - a.sold).slice(0, 6);
    return { revenue, units, byCat, max, top, session: orders.reduce((s, o) => s + o.total, 0) };
  }, [products, orders]);

  if (!user) return <Navigate to="/connexion?retour=/admin" replace />;
  if (user.role !== 'admin') {
    return (
      <div className="wrap max-w-xl pt-20 text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-tomato" />
        <h1 className="h-display mt-4 text-5xl">Accès gérant</h1>
        <p className="mt-2 text-ink/70">Réservé au restaurant. Compte de test : <code>admin@smashhouse.demo</code> / <code>admin1234</code>.</p>
        <Link to="/" className="btn-red mt-6">Retour</Link>
      </div>
    );
  }

  const addProduct = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const name = String(d.get('name')).trim();
    const price = Math.round(parseFloat(String(d.get('price')).replace(',', '.')) * 100);
    if (!name || !(price > 0)) return;
    const cat = String(d.get('category')) as CategoryId;
    const same = products.find((p) => p.category === cat);
    const p: Product = {
      id: `${name.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`,
      name, category: cat, price, description: String(d.get('description')).trim() || 'Nouveau produit.',
      image: String(d.get('image')).trim() || same?.image || '', tags: ['new'], kcal: 0, allergens: [], available: true,
      options: same?.options ?? 'side', sold: 0,
    };
    upsertProduct(p); setAdding(false); notify('Produit ajouté à la carte');
  };

  return (
    <div className="wrap pt-10">
      <p className="label">Espace gérant</p>
      <h1 className="h-display text-6xl">Tableau de bord</h1>
      <div className="mt-4"><DemoNotice><b>Démonstration :</b> contrôle d’accès côté navigateur uniquement et données perdues au rechargement. En production : Supabase Auth + rôle admin vérifié côté serveur (RLS), commandes reçues en temps réel.</DemoNotice></div>

      <nav aria-label="Gérant" className="no-scrollbar mt-6 flex gap-2 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" onClick={() => setParams({ onglet: id })} aria-current={tab === id ? 'page' : undefined} className={`chip flex-none ${tab === id ? 'chip-on' : 'chip-off'}`}><Icon className="h-4 w-4" /> {label}</button>
        ))}
      </nav>

      {tab === 'commandes' && (
        <div className="mt-6">
          {orders.length === 0 ? (
            <div className="rounded-3xl bg-white p-10 text-center"><p className="h-display text-3xl">Aucune commande pour l’instant</p><p className="mt-2 text-sm text-ink/60">Passez une commande test depuis le site : elle arrive ici en direct.</p></div>
          ) : (
            <div className="no-scrollbar grid auto-cols-[minmax(260px,1fr)] grid-flow-col gap-4 overflow-x-auto pb-4">
              {COLUMNS.map((col) => {
                const list = orders.filter((o) => o.status === col);
                return (
                  <section key={col} aria-label={STATUS_LABELS[col]} className="rounded-3xl bg-ink/5 p-3">
                    <p className="flex items-center justify-between px-2 py-1 font-extrabold">{STATUS_LABELS[col]} <span className={`rounded-full px-2 text-xs ${STATUS_STYLES[col]}`}>{list.length}</span></p>
                    <div className="mt-2 space-y-3">
                      {list.map((o) => (
                        <article key={o.id} className="rounded-2xl bg-white p-4 text-sm shadow-sm">
                          <div className="flex justify-between font-extrabold"><span>{o.number.slice(-4)}</span><span>{formatPrice(o.total)}</span></div>
                          <p className="text-xs text-ink/60">{MODE_LABELS[o.mode]} · {o.slot} · {o.customer.name}</p>
                          <ul className="mt-2 space-y-1">{o.lines.map((l) => <li key={l.key}><b>{l.quantity}×</b> {l.name}<span className="block text-xs text-ink/50">{describe(l.options).join(' · ')}</span></li>)}</ul>
                          {o.note && <p className="mt-2 rounded-lg bg-mustard/30 p-2 text-xs">📝 {o.note}</p>}
                          <div className="mt-3 flex gap-2">
                            {NEXT[o.status] && <button onClick={() => { setOrderStatus(o.id, o.mode === 'livraison' && o.status === 'preparation' ? 'livraison' : NEXT[o.status]!); notify('Statut mis à jour'); }} className="btn-red min-h-10 flex-1 px-3 text-xs shadow-none">→ {STATUS_LABELS[o.mode === 'livraison' && o.status === 'preparation' ? 'livraison' : NEXT[o.status]!]}</button>}
                            {o.status !== 'terminee' && <button onClick={() => setOrderStatus(o.id, 'annulee')} className="min-h-10 rounded-full px-3 text-xs font-bold text-tomato hover:bg-tomato/10">Annuler</button>}
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'carte' && (
        <div className="mt-6 space-y-4">
          {!adding ? (
            <button onClick={() => setAdding(true)} className="btn-red"><Plus className="h-5 w-5" /> Ajouter un produit</button>
          ) : (
            <form onSubmit={addProduct} className="card grid gap-3 sm:grid-cols-2">
              <label className="field">Nom<input name="name" className="input" required /></label>
              <label className="field">Prix (€)<input name="price" inputMode="decimal" className="input" required /></label>
              <label className="field">Catégorie<select name="category" className="input">{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
              <label className="field">URL photo (facultatif)<input name="image" className="input" placeholder="https://…" /></label>
              <label className="field sm:col-span-2">Description<input name="description" className="input" /></label>
              <div className="flex gap-2 sm:col-span-2"><button className="btn-red">Ajouter</button><button type="button" onClick={() => setAdding(false)} className="btn-ghost">Annuler</button></div>
            </form>
          )}
          <div className="overflow-x-auto rounded-3xl bg-white ring-1 ring-ink/5">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-ink text-left text-xs uppercase tracking-wider text-cream"><tr><th className="p-3">Produit</th><th className="p-3">Catégorie</th><th className="p-3">Prix (€)</th><th className="p-3">Disponible</th><th className="p-3" /></tr></thead>
              <tbody className="divide-y divide-ink/5">
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="p-3"><div className="flex items-center gap-3"><Img src={p.image} alt="" className="h-12 w-12 flex-none rounded-xl" /><b>{p.name}</b></div></td>
                    <td className="p-3">{CATEGORIES.find((c) => c.id === p.category)?.label}</td>
                    <td className="p-3">
                      <label className="sr-only" htmlFor={`pr-${p.id}`}>Prix de {p.name}</label>
                      <input id={`pr-${p.id}`} type="number" step="0.10" min="0" defaultValue={(p.price / 100).toFixed(2)} className="input min-h-10 w-24 px-3"
                        onBlur={(e) => { const v = Math.round(parseFloat(e.target.value) * 100); if (v > 0 && v !== p.price) { upsertProduct({ ...p, price: v }); notify('Prix mis à jour'); } }} />
                    </td>
                    <td className="p-3">
                      <button role="switch" aria-checked={p.available} aria-label={`${p.name} disponible`} onClick={() => { upsertProduct({ ...p, available: !p.available }); notify(p.available ? 'Marqué en rupture' : 'De nouveau disponible'); }}
                        className={`relative h-8 w-14 rounded-full transition ${p.available ? 'bg-emerald-500' : 'bg-ink/20'}`}>
                        <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${p.available ? 'left-7' : 'left-1'}`} />
                      </button>
                    </td>
                    <td className="p-3 text-right"><button aria-label={`Supprimer ${p.name}`} onClick={() => { if (window.confirm(`Supprimer « ${p.name} » ?`)) { deleteProduct(p.id); notify('Produit supprimé'); } }} className="grid h-10 w-10 place-items-center rounded-full text-ink/40 hover:bg-tomato/10 hover:text-tomato"><Trash2 className="h-4 w-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-ink/50">Astuce : désactivez un produit en rupture, il reste visible mais ne peut plus être commandé.</p>
        </div>
      )}

      {tab === 'stats' && (
        <div className="mt-6 space-y-6">
          <p className="text-sm text-ink/60">Chiffres de démonstration (ventes fictives) + commandes de la session.</p>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[['CA cumulé (démo)', formatPrice(stats.revenue)], ['Articles vendus (démo)', stats.units.toLocaleString('fr-FR')], ['Commandes session', String(orders.length)], ['CA session', formatPrice(stats.session)]].map(([l, v]) => (
              <div key={l} className="card"><p className="text-xs text-ink/55">{l}</p><p className="mt-1 text-2xl font-extrabold tabular-nums">{v}</p></div>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="card">
              <h2 className="label">Ventes par catégorie (démo)</h2>
              <div className="mt-4 space-y-3">{stats.byCat.map((b) => (
                <div key={b.label}><div className="mb-1 flex justify-between text-sm"><span>{b.label}</span><span className="tabular-nums">{formatPrice(b.v)}</span></div><div className="h-3 overflow-hidden rounded-full bg-ink/5"><div className="h-full rounded-full bg-tomato" style={{ width: `${(b.v / stats.max) * 100}%` }} /></div></div>
              ))}</div>
            </section>
            <section className="card">
              <h2 className="label">Top produits (démo)</h2>
              <ol className="mt-3 divide-y divide-ink/5">{stats.top.map((p, i) => <li key={p.id} className="flex items-center gap-3 py-2 text-sm"><span className="h-display w-6 text-xl text-crust">{i + 1}</span><Img src={p.image} alt="" className="h-9 w-9 rounded-lg" /><span className="flex-1 font-bold">{p.name}</span><span className="text-ink/60">{p.sold} ventes</span></li>)}</ol>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
