import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <p className="font-display text-6xl font-extrabold text-brand-gradient">404</p>
        <h1 className="mt-4 text-xl font-bold text-navy">Page introuvable</h1>
        <p className="mt-2 text-sm text-muted">Cette page n&apos;existe pas ou a été déplacée.</p>
        <ButtonLink href="/" className="mt-6">Retour au tableau de bord</ButtonLink>
      </div>
    </div>
  );
}
