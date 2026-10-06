"use client";

import { useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, Bot, Cog, LayoutGrid, Sparkles, X } from "lucide-react";
import { BRAND } from "@/config/brand";
import { useStore } from "@/lib/store/AppStore";
import { useAppActions } from "@/lib/store/useAppActions";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { LogoMark } from "../layout/Logo";
import { useDemo } from "./DemoProvider";
import { DEMO_INTERVENTION_ID, DEMO_STEPS } from "./steps";

/** Barre de visite guidée + effets du scénario + écran final. */
export function DemoOverlay() {
  const demo = useDemo();
  const { data } = useStore();
  const actions = useAppActions();
  const handledReset = useRef(0);

  // Démarrage : données remises à zéro sur le scénario de démonstration.
  useEffect(() => {
    if (demo.resetToken > handledReset.current) {
      handledReset.current = demo.resetToken;
      actions.resetDemo("demo");
    }
  }, [demo.resetToken, actions]);

  // Étape « Checklist » : si l'intervention n'a pas été démarrée, on la démarre.
  const current = DEMO_STEPS[demo.step];
  const demoIntervention = data.interventions.find((i) => i.id === DEMO_INTERVENTION_ID);
  useEffect(() => {
    if (!demo.active || !current) return;
    if ((current.key === "checklist" || current.key === "signature") && demoIntervention?.status === "PLANIFIEE") {
      actions.startIntervention(DEMO_INTERVENTION_ID);
    }
  }, [demo.active, current, demoIntervention?.status, actions]);

  if (!demo.active) return null;
  if (demo.finished) return <DemoFinale />;

  return (
    <div className="no-print pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex justify-center px-3 pb-3 sm:px-6 sm:pb-5">
      <div
        key={demo.step}
        className="pointer-events-auto w-full max-w-3xl animate-slide-up overflow-hidden rounded-2xl border border-white/10 bg-navy/95 text-white shadow-pop backdrop-blur-md"
      >
        <div className="flex h-1 w-full bg-white/10">
          <div className="bg-brand-gradient transition-all duration-500" style={{ width: `${((demo.step + 1) / demo.total) * 100}%` }} />
        </div>
        <div className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
          <span className="hidden size-10 shrink-0 place-items-center rounded-xl bg-white/10 font-display text-lg font-bold text-cyan-brand sm:grid">
            {demo.step + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-cyan-brand uppercase">
              Mode démo · Étape {demo.step + 1} / {demo.total}
            </p>
            <p className="truncate font-display text-[15px] font-bold sm:text-base">{current.title}</p>
            <p className="hidden text-xs leading-snug text-white/70 sm:block">{current.caption}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              onClick={demo.prev}
              disabled={demo.step === 0}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold text-white/80 transition hover:bg-white/10 disabled:opacity-30 sm:px-3"
              aria-label="Étape précédente"
            >
              <ArrowLeft className="size-4" />
              <span className="hidden md:inline">Précédent</span>
            </button>
            <span className="tabular hidden text-xs font-semibold text-white/60 sm:inline">
              Étape {demo.step + 1} / {demo.total}
            </span>
            <button
              onClick={demo.next}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-gradient px-3 text-xs font-semibold shadow-glow transition hover:brightness-110 sm:px-4"
            >
              <span>{demo.step === demo.total - 1 ? "Terminer" : "Suivant"}</span>
              <ArrowRight className="size-4" />
            </button>
            <button onClick={demo.stop} className="grid size-9 place-items-center rounded-xl text-white/50 transition hover:bg-white/10 hover:text-white" aria-label="Quitter le mode démo">
              <X className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const PILLARS = [
  { icon: LayoutGrid, label: "Applications métier" },
  { icon: Cog, label: "Automatisation" },
  { icon: Sparkles, label: "Solutions digitales" },
  { icon: Bot, label: "Intelligence artificielle" },
];

function DemoFinale() {
  const demo = useDemo();
  const toast = useToast();

  const contact = () => {
    if (BRAND.contactUrl) {
      window.open(BRAND.contactUrl, "_blank", "noopener,noreferrer");
    } else {
      toast.success("Merci pour votre intérêt !", "E-DUST Solutions vous recontacte rapidement.");
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex animate-fade-in items-center justify-center overflow-y-auto bg-navy px-6 py-10 text-white">
      <div className="pointer-events-none absolute -top-40 -left-32 size-[520px] rounded-full bg-electric opacity-30 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 -bottom-40 size-[460px] rounded-full bg-cyan-brand opacity-20 blur-[120px]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }}
      />

      <button
        onClick={demo.stop}
        className="absolute top-5 right-5 grid size-10 place-items-center rounded-xl text-white/50 transition hover:bg-white/10 hover:text-white"
        aria-label="Fermer"
      >
        <X className="size-5" />
      </button>

      <div className="relative flex max-w-3xl flex-col items-center text-center">
        <div className="flex animate-fade-up items-center gap-3">
          <LogoMark className="size-11" />
          <span className="font-display text-xl font-extrabold tracking-[0.2em]">E-DUST SOLUTIONS</span>
        </div>

        <h2
          className="mt-10 animate-fade-up font-display text-3xl leading-[1.15] font-extrabold tracking-tight sm:text-5xl"
          style={{ animationDelay: "120ms" }}
        >
          VOTRE ENTREPRISE MÉRITE
          <br />
          DES OUTILS <span className="text-brand-gradient">ADAPTÉS</span>
          <br className="sm:hidden" /> À SON FONCTIONNEMENT.
        </h2>

        <div className="mt-10 grid w-full max-w-2xl animate-fade-up grid-cols-2 gap-3 sm:grid-cols-4" style={{ animationDelay: "260ms" }}>
          {PILLARS.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 px-3 py-4 backdrop-blur">
              <Icon className="size-5 text-cyan-brand" />
              <span className="text-[13px] font-semibold">{label}</span>
            </div>
          ))}
        </div>

        <button
          onClick={contact}
          className={cn(
            "mt-10 inline-flex h-14 animate-fade-up items-center gap-3 rounded-2xl bg-brand-gradient px-8 text-[15px] font-bold tracking-wide shadow-glow transition hover:scale-[1.02] hover:brightness-110",
          )}
          style={{ animationDelay: "400ms" }}
        >
          PARLONS DE VOTRE PROJET
          <ArrowRight className="size-5" />
        </button>
        <p className="mt-4 animate-fade-up text-sm font-medium tracking-wide text-white/60" style={{ animationDelay: "480ms" }}>
          {BRAND.vendor}
        </p>

        <button onClick={demo.start} className="mt-10 text-xs text-white/40 underline-offset-4 hover:text-white/70 hover:underline">
          Rejouer la démonstration
        </button>
      </div>
    </div>
  );
}
