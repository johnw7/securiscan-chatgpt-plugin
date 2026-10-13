import { Minus, Plus } from 'lucide-react';

interface Props {
  value: number;
  min?: number;
  max: number;
  onChange: (n: number) => void;
  small?: boolean;
}

export default function QuantitySelector({ value, min = 1, max, onChange, small }: Props) {
  const h = small ? 'h-10' : 'h-12';
  return (
    <div className={`inline-flex items-center rounded-full border border-mist-300 ${h}`}>
      <button type="button" aria-label="Diminuer la quantité" onClick={() => onChange(value - 1)} disabled={value <= min} className={`grid ${h} w-11 place-items-center rounded-full disabled:opacity-30`}>
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-7 text-center text-sm font-semibold" aria-live="polite">{value}</span>
      <button type="button" aria-label="Augmenter la quantité" onClick={() => onChange(value + 1)} disabled={value >= max} className={`grid ${h} w-11 place-items-center rounded-full disabled:opacity-30`}>
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
