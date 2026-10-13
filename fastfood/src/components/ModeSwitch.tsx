import { Bike, ShoppingBag, Utensils } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { Mode } from '../types';

const MODES: { id: Mode; label: string; icon: typeof Bike; hint: string }[] = [
  { id: 'livraison', label: 'Livraison', icon: Bike, hint: '25–35 min' },
  { id: 'emporter', label: 'À emporter', icon: ShoppingBag, hint: 'Prêt en 15 min' },
  { id: 'surplace', label: 'Sur place', icon: Utensils, hint: 'Commandez, on vous sert' },
];

export default function ModeSwitch({ dark = false }: { dark?: boolean }) {
  const { mode, setMode } = useStore();
  return (
    <div role="radiogroup" aria-label="Mode de commande" className={`grid grid-cols-3 gap-1 rounded-2xl p-1 ${dark ? 'bg-white/10' : 'bg-ink/5'}`}>
      {MODES.map(({ id, label, icon: Icon, hint }) => {
        const on = mode === id;
        return (
          <button key={id} type="button" role="radio" aria-checked={on} onClick={() => setMode(id)}
            className={`flex min-h-14 flex-col items-center justify-center rounded-xl px-2 py-2 text-center transition ${on ? 'bg-mustard text-ink shadow' : dark ? 'text-cream/80 hover:bg-white/10' : 'text-ink/70 hover:bg-white'}`}>
            <span className="flex flex-col items-center gap-0.5 whitespace-nowrap text-[13px] font-extrabold sm:flex-row sm:gap-1.5 sm:text-sm"><Icon className="h-4 w-4" aria-hidden="true" /> {label}</span>
            <span className="hidden text-[11px] font-medium opacity-75 sm:block">{hint}</span>
          </button>
        );
      })}
    </div>
  );
}
