import type { Metadata } from "next";
import { MfaEnrollForm } from "../mfa-forms";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Activer la double authentification" };

export default async function MfaEnrollPage() {
  await requireUser();
  return (
    <>
      <h1 className="font-display text-2xl font-semibold">Activer la double authentification</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Obligatoire pour les administrateurs, recommandée pour tous.</p>
      <MfaEnrollForm />
    </>
  );
}
