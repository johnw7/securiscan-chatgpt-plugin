"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "info";
interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
}

interface ToastApi {
  success: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => setItems((list) => list.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (kind: ToastKind, title: string, description?: string) => {
      const id = Date.now() + Math.random();
      setItems((list) => [...list.slice(-2), { id, kind, title, description }]);
      window.setTimeout(() => dismiss(id), 4200);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({ success: (t, d) => push("success", t, d), info: (t, d) => push("info", t, d) }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-3 z-[80] flex flex-col items-center gap-2 px-4 sm:top-20 sm:right-6 sm:left-auto sm:items-end sm:px-0"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex w-full max-w-sm animate-slide-in-right items-start gap-3 rounded-2xl border border-line bg-white p-4 shadow-pop"
          >
            <span
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-full",
                t.kind === "success" ? "bg-emerald-50 text-emerald-600" : "bg-electric-50 text-electric",
              )}
            >
              {t.kind === "success" ? <CheckCircle2 className="size-5" /> : <Info className="size-5" />}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm font-semibold text-navy">{t.title}</p>
              {t.description && <p className="mt-0.5 text-xs leading-relaxed text-muted">{t.description}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="text-slate-300 hover:text-slate-500" aria-label="Fermer la notification">
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast doit être utilisé sous <ToastProvider>.");
  return ctx;
}
