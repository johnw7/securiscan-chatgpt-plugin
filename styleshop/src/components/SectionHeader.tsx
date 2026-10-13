import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SectionHeader({ title, to, kicker }: { title: string; to?: string; kicker?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        {kicker && <p className="mb-1 text-xs uppercase tracking-[0.2em] text-mist-500">{kicker}</p>}
        <h2 className="font-display text-3xl md:text-4xl">{title}</h2>
      </div>
      {to && (
        <Link to={to} className="inline-flex min-h-11 items-center gap-1 text-sm underline-offset-4 hover:underline">
          Tout voir <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
