import type { Metadata } from "next";
import { Notice } from "@/components/ui/misc";
import { ProtectWizard } from "@/features/protect/wizard";

export const metadata: Metadata = {
  title: "Diagnostic préliminaire de sûreté",
  description: "Auto-évaluation indicative et gratuite pour particuliers, commerces et petites entreprises.",
  robots: { index: true, follow: true },
};

export default function DiagnosticPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-text">NOAMIS PROTECT</p>
        <h1 className="mt-2 font-display text-4xl font-semibold">Diagnostic préliminaire de sûreté</h1>
        <p className="mt-2 max-w-2xl text-muted">Quelques questions pour faire le point sur vos bonnes pratiques. Gratuit, anonyme, sans adresse : vos réponses ne sont pas liées à votre identité sauf si vous demandez à être recontacté.</p>
      </div>
      <Notice tone="info">Ce questionnaire est une auto-évaluation indicative ; il ne remplace pas un audit de sûreté réalisé sur site par un consultant.</Notice>
      <ProtectWizard />
    </div>
  );
}
