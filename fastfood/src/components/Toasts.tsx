import { CheckCircle2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function Toasts() {
  const { toasts } = useStore();
  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-24 z-[60] flex flex-col items-center gap-2 sm:bottom-6 sm:left-auto sm:right-6 sm:items-end" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="flex animate-up items-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-cream shadow-2xl">
          <CheckCircle2 className="h-4 w-4 text-mustard" aria-hidden="true" /> {t.message}
        </div>
      ))}
    </div>
  );
}
