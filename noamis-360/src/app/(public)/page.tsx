import Link from "next/link";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none absolute -inset-x-20 -top-20 h-80 bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--gold)_16%,transparent),transparent_65%)]" />
      <section className="relative py-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-text">NOAMIS 360°</p>
        <h1 className="mx-auto mt-4 max-w-3xl font-display text-4xl font-semibold leading-tight sm:text-5xl">Anticiper les risques. Maîtriser vos projets de sûreté.</h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted">La plateforme de NOAMIS Sûreté Conseil, conseil indépendant en sécurité et sûreté : suivi de mission, livrables et échanges sécurisés pour nos clients.</p>
      </section>
      <div className="relative grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-7">
          <ShieldCheck className="size-7 text-gold" aria-hidden />
          <h2 className="mt-4 text-xl font-semibold">Diagnostic préliminaire gratuit</h2>
          <p className="mt-2 text-sm text-muted">Particuliers, commerces et petites entreprises : une auto-évaluation indicative en quelques minutes, sans adresse ni inscription.</p>
          <Button asChild className="mt-6"><Link href="/diagnostic">Commencer le diagnostic <ArrowRight /></Link></Button>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-7">
          <LockKeyhole className="size-7 text-gold" aria-hidden />
          <h2 className="mt-4 text-xl font-semibold">Espace sécurisé</h2>
          <p className="mt-2 text-sm text-muted">Clients : suivez vos missions, téléchargez vos livrables et échangez avec votre consultant. Équipe NOAMIS : accès au pilotage.</p>
          <Button asChild variant="outline" className="mt-6"><Link href="/login">Se connecter <ArrowRight /></Link></Button>
        </div>
      </div>
    </div>
  );
}
