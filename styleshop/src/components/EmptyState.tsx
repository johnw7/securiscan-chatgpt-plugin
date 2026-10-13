import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmptyState({ icon: Icon, title, text, cta = 'Découvrir la collection', to = '/catalogue' }: { icon: LucideIcon; title: string; text?: string; cta?: string; to?: string }) {
  return (
    <div className="flex flex-col items-center rounded-3xl bg-sand-50 px-6 py-16 text-center">
      <Icon className="mb-4 h-10 w-10 text-sand-600" strokeWidth={1.3} aria-hidden="true" />
      <p className="font-display text-2xl">{title}</p>
      {text && <p className="mt-2 max-w-md text-sm text-mist-500">{text}</p>}
      <Link to={to} className="btn-primary mt-6">{cta}</Link>
    </div>
  );
}
