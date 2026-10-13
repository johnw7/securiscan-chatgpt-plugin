import { Star } from 'lucide-react';

export default function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${value} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} style={{ width: size, height: size }} className={i <= Math.round(value) ? 'fill-ink text-ink' : 'text-mist-300'} strokeWidth={1.5} />
      ))}
    </span>
  );
}
