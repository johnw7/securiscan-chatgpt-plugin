import type { Metadata } from "next";
import { LoginForm } from "../auth-forms";

export const metadata: Metadata = { title: "Connexion" };

const ERRORS: Record<string, string> = {
  no_access: "Votre compte n'est rattaché à aucun espace actif. Contactez NOAMIS.",
  link_invalid: "Lien invalide ou expiré. Recommencez la procédure.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return (
    <>
      <h1 className="font-display text-2xl font-semibold">Connexion</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Espace NOAMIS et portail client sécurisé.</p>
      <LoginForm next={next} initialError={error ? ERRORS[error] : undefined} />
    </>
  );
}
