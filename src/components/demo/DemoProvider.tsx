"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useStoreReady } from "@/lib/store/AppStore";
import { DEMO_STEPS } from "./steps";

interface DemoApi {
  active: boolean;
  step: number; // index, DEMO_STEPS.length = écran final
  total: number;
  finished: boolean;
  start: () => void;
  stop: () => void;
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
  /** Demande de réinitialisation des données (consommée par <DemoEffects/>). */
  resetToken: number;
}

const DemoContext = createContext<DemoApi | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const ready = useStoreReady();
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [resetToken, setResetToken] = useState(0);
  const total = DEMO_STEPS.length;

  const goTo = useCallback(
    (index: number) => {
      const bounded = Math.max(0, Math.min(total, index));
      setStep(bounded);
      if (bounded < total) {
        router.push(DEMO_STEPS[bounded].href, { scroll: false });
        window.scrollTo({ top: 0 });
      }
    },
    [router, total],
  );

  const start = useCallback(() => {
    setResetToken((t) => t + 1);
    setActive(true);
    goTo(0);
  }, [goTo]);

  const stop = useCallback(() => {
    setActive(false);
    setStep(0);
  }, []);

  const next = useCallback(() => goTo(step + 1), [goTo, step]);
  const prev = useCallback(() => goTo(step - 1), [goTo, step]);

  // Raccourcis clavier pour enregistrer la vidéo sans viser les boutons.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable=true]")) return;
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape") stop();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, next, prev, stop]);

  // Lien direct « ?demo=1 » pour lancer la démonstration (pratique avant un enregistrement).
  useEffect(() => {
    if (!ready || active) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") === "1") start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, pathname]);

  const value = useMemo<DemoApi>(
    () => ({ active, step, total, finished: active && step >= total, start, stop, next, prev, goTo, resetToken }),
    [active, step, total, start, stop, next, prev, goTo, resetToken],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoApi {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo doit être utilisé sous <DemoProvider>.");
  return ctx;
}
