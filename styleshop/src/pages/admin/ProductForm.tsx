import { useState, type FormEvent } from 'react';
import ProductImage from '../../components/ProductImage';
import { CATEGORY_LABELS } from '../../data/products';
import { uid } from '../../services/ids';
import { ALL_SIZES, type Category, type ColorOption, type Product, type Size } from '../../types';

interface Props {
  initial?: Product;
  onSave: (p: Product) => void;
  onCancel: () => void;
}

const PALETTE: ColorOption[] = [
  { name: 'Blanc', hex: '#ffffff' }, { name: 'Noir', hex: '#111111' }, { name: 'Beige', hex: '#d8c7ad' },
  { name: 'Camel', hex: '#b08654' }, { name: 'Gris chiné', hex: '#a3a3a0' }, { name: 'Bleu marine', hex: '#1f2f4d' },
  { name: 'Bleu denim', hex: '#4a6587' }, { name: 'Kaki', hex: '#6b6a4b' }, { name: 'Écru', hex: '#efe8da' },
  { name: 'Rose poudré', hex: '#e7c4c0' }, { name: 'Bordeaux', hex: '#6d1f2b' }, { name: 'Marron', hex: '#5b3a29' },
];

export default function ProductForm({ initial, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState<Category>(initial?.category ?? 'femme');
  const [type, setType] = useState(initial?.type ?? '');
  const [price, setPrice] = useState(initial ? (initial.price / 100).toFixed(2) : '');
  const [compareAt, setCompareAt] = useState(initial?.compareAtPrice ? (initial.compareAtPrice / 100).toFixed(2) : '');
  const [stock, setStock] = useState(String(initial?.stock ?? 10));
  const [description, setDescription] = useState(initial?.description ?? '');
  const [details, setDetails] = useState(initial?.details.join('\n') ?? '');
  const [sizes, setSizes] = useState<Size[]>(initial?.sizes ?? ['S', 'M', 'L']);
  const [colors, setColors] = useState<string[]>(initial?.colors.map((c) => c.name) ?? ['Noir']);
  const [images, setImages] = useState(initial?.images.join('\n') ?? '');
  const [error, setError] = useState('');

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const p = Math.round(parseFloat(price.replace(',', '.')) * 100);
    const c = compareAt ? Math.round(parseFloat(compareAt.replace(',', '.')) * 100) : undefined;
    const imgs = images.split('\n').map((s) => s.trim()).filter(Boolean);
    if (!name.trim() || !type.trim() || !description.trim()) return setError('Nom, type et description sont requis.');
    if (!(p > 0)) return setError('Prix invalide.');
    if (c !== undefined && !(c > p)) return setError('Le prix barré doit être supérieur au prix de vente.');
    if (!sizes.length || !colors.length) return setError('Choisissez au moins une taille et une couleur.');
    if (imgs.some((u) => !/^https:\/\//.test(u))) return setError('Les images doivent être des URL https.');

    onSave({
      id: initial?.id ?? `produit-${uid()}`,
      name: name.trim(), category, type: type.trim(), price: p, compareAtPrice: c,
      description: description.trim(), details: details.split('\n').map((s) => s.trim()).filter(Boolean),
      sizes: ALL_SIZES.filter((s) => sizes.includes(s)),
      colors: PALETTE.filter((x) => colors.includes(x.name)),
      images: imgs, stock: Math.max(0, parseInt(stock, 10) || 0),
      createdAt: initial?.createdAt ?? new Date().toISOString().slice(0, 10),
      sold: initial?.sold ?? 0, reviews: initial?.reviews ?? [],
    });
  };

  const firstImage = images.split('\n')[0]?.trim();

  return (
    <form onSubmit={submit} className="card grid gap-5 lg:grid-cols-[1fr_260px]">
      <div className="grid gap-4 sm:grid-cols-2">
        <h2 className="font-display text-3xl sm:col-span-2">{initial ? 'Modifier le vêtement' : 'Ajouter un vêtement'}</h2>
        <label className="field sm:col-span-2">Nom<input value={name} onChange={(e) => setName(e.target.value)} className="input" required /></label>
        <label className="field">Catégorie
          <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className="input">
            {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
          </select>
        </label>
        <label className="field">Type (ex. Robes, Jeans)<input value={type} onChange={(e) => setType(e.target.value)} className="input" required /></label>
        <label className="field">Prix (€)<input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" className="input" required /></label>
        <label className="field">Prix barré (€, facultatif)<input value={compareAt} onChange={(e) => setCompareAt(e.target.value)} inputMode="decimal" className="input" /></label>
        <label className="field">Stock<input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} className="input" /></label>
        <label className="field sm:col-span-2">Description<textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input py-3" required /></label>
        <label className="field sm:col-span-2">Détails (un par ligne)<textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} className="input py-3" /></label>
        <fieldset className="sm:col-span-2">
          <legend className="mb-2 text-sm">Tailles disponibles</legend>
          <div className="flex flex-wrap gap-2">
            {ALL_SIZES.map((s) => <button type="button" key={s} aria-pressed={sizes.includes(s)} onClick={() => setSizes(toggle(sizes, s))} className={`chip ${sizes.includes(s) ? 'chip-on' : 'chip-off'}`}>{s}</button>)}
          </div>
        </fieldset>
        <fieldset className="sm:col-span-2">
          <legend className="mb-2 text-sm">Couleurs</legend>
          <div className="flex flex-wrap gap-2">
            {PALETTE.map((c) => (
              <button type="button" key={c.name} aria-pressed={colors.includes(c.name)} onClick={() => setColors(toggle(colors, c.name))} className={`chip gap-2 ${colors.includes(c.name) ? 'chip-on' : 'chip-off'}`}>
                <span className="h-4 w-4 rounded-full border border-mist-300" style={{ background: c.hex }} /> {c.name}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="field sm:col-span-2">URL des photos (une par ligne, https)<textarea value={images} onChange={(e) => setImages(e.target.value)} rows={3} className="input py-3 font-mono text-xs" placeholder="https://…" /></label>
        {error && <p className="text-sm text-red-700 sm:col-span-2" role="alert">{error}</p>}
        <div className="flex gap-3 sm:col-span-2">
          <button className="btn-primary">Enregistrer</button>
          <button type="button" onClick={onCancel} className="btn-secondary">Annuler</button>
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm">Aperçu</p>
        <ProductImage key={firstImage} src={firstImage} alt={name || 'Aperçu'} fallbackLabel={type || 'Photo'} className="aspect-[3/4] w-full rounded-2xl" />
      </div>
    </form>
  );
}
