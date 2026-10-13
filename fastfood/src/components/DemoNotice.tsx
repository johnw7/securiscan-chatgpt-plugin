import { Info } from 'lucide-react';
import type { ReactNode } from 'react';

/** Bandeau signalant clairement une fonctionnalité de démonstration. */
export default function DemoNotice({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-amber-50 p-4 text-sm leading-relaxed text-amber-900 ring-1 ring-amber-200">
      <Info className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
