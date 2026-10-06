"use client";

import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, Camera, CheckCircle2, ListChecks, Navigation, PenLine, WifiOff } from "lucide-react";
import { useStoreReady } from "@/lib/store/AppStore";
import { useDemo } from "@/components/demo/DemoProvider";
import { Logo } from "@/components/layout/Logo";
import { cn } from "@/lib/utils";
import { TechnicianApp } from "./TechnicianApp";

const FEATURES = [
  { icon: Navigation, text: "Itinéraire et coordonnées du client en un geste" },
  { icon: ListChecks, text: "Checklist adaptée à chaque type d'intervention" },
  { icon: Camera, text: "Photos prises directement depuis le smartphone" },
  { icon: PenLine, text: "Signature du client sur l'écran" },
  { icon: CheckCircle2, text: "Rapport envoyé automatiquement à la clôture" },
  { icon: WifiOff, text: "Mode hors connexion prévu (synchronisation différée)" },
];

function Loading() {
  return (
    <div className="grid h-full place-items-center bg-navy">
      <span className="size-8 animate-spin rounded-full border-2 border-white/20 border-t-cyan-brand" />
    </div>
  );
}

/**
 * Vue technicien : plein écran sur smartphone, maquette de téléphone sur
 * tablette / ordinateur (idéal pour enregistrer la démonstration).
 */
export function TechnicianShell() {
  const ready = useStoreReady();
  const demo = useDemo();
  const app = ready ? (
    <Suspense fallback={<Loading />}>
      <TechnicianApp />
    </Suspense>
  ) : (
    <Loading />
  );

  return (
    <>
      {/* Smartphone : application plein écran */}
      <div className={cn("fixed inset-0 md:hidden", demo.active && "bottom-[76px]")}>{app}</div>

      {/* Tablette / ordinateur : maquette */}
      <div className="relative hidden min-h-dvh overflow-hidden bg-navy md:block">
        <div className="pointer-events-none absolute -top-40 -left-40 size-[560px] rounded-full bg-electric opacity-25 blur-[120px]" />
        <div className="pointer-events-none absolute -right-40 -bottom-40 size-[520px] rounded-full bg-cyan-brand opacity-15 blur-[120px]" />
        <div className={cn("relative mx-auto flex min-h-dvh max-w-6xl items-center gap-16 px-8 py-8", demo.active && "pb-[136px]")}>
          <div className="hidden max-w-sm flex-1 text-white lg:block">
            <Link href="/" className="mb-10 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white">
              <ArrowLeft className="size-4" /> Retour au back-office
            </Link>
            <Logo dark />
            <h1 className="mt-8 font-display text-4xl leading-tight font-extrabold">
              L&apos;application de vos <span className="text-brand-gradient">techniciens terrain</span>
            </h1>
            <p className="mt-4 text-white/70">Toute la journée du technicien sur son smartphone : plus de papier, plus d&apos;appels pour savoir où il en est.</p>
            <ul className="mt-8 space-y-3">
              {FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-white/85">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 text-cyan-brand"><Icon className="size-4" /></span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <div className="mx-auto flex flex-col items-center lg:mx-0">
            <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white lg:hidden">
              <ArrowLeft className="size-4" /> Retour au back-office
            </Link>
            <div
              className="relative rounded-[48px] bg-[#0b1020] p-3 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/10"
              style={{ width: 390 + 24, height: `min(${844 + 24}px, calc(100dvh - ${demo.active ? 184 : 64}px))` }}
            >
              <div className="absolute top-3 left-1/2 z-20 h-7 w-32 -translate-x-1/2 rounded-b-2xl bg-[#0b1020]" />
              <div className="relative h-full overflow-hidden rounded-[38px] bg-white pt-5">{app}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
