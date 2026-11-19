import type { Metadata } from "next";
import { MfaChallengeForm } from "./mfa-forms";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Double authentification" };

export default async function MfaPage() {
  await requireUser();
  return (
    <>
      <h1 className="font-display text-2xl font-semibold">Double authentification</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Les comptes administrateurs exigent une vérification supplémentaire.</p>
      <MfaChallengeForm />
    </>
  );
}
