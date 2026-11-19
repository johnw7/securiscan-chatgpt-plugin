import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mentions légales" };

export default function LegalPage() {
  return (
    <article className="max-w-3xl space-y-4 text-sm leading-relaxed">
      <h1 className="font-display text-3xl font-semibold">Mentions légales</h1>
      <p><strong>Éditeur :</strong> NOAMIS Sûreté Conseil — entrepreneur individuel — SIREN 907 525 158 — Saint-Germain-en-Laye (78100) — contact@noamis.fr.</p>
      <p><strong>Directeur de la publication :</strong> le dirigeant de NOAMIS Sûreté Conseil.</p>
      <p><strong>Hébergement :</strong> Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis — et Supabase pour les données.</p>
      <p className="text-muted">Informations reprises du site noamis.fr, dont la page de mentions indique elle-même des éléments « à confirmer » (adresse complète, numéro RNE/RCS, TVA). À compléter avant la mise en production publique.</p>
      <p>NOAMIS est un conseil indépendant : il ne vend ni n&apos;installe d&apos;équipements, et n&apos;exerce aucune activité de surveillance, de gardiennage ou de protection rapprochée.</p>
    </article>
  );
}
