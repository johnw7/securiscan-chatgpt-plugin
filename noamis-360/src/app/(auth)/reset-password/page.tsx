import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "../auth-forms";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login?error=link_invalid");
  return (
    <>
      <h1 className="font-display text-2xl font-semibold">Définir un mot de passe</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Choisissez un mot de passe robuste et unique.</p>
      <ResetPasswordForm />
    </>
  );
}
