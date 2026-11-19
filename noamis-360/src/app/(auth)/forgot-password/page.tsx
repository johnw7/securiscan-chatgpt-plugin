import type { Metadata } from "next";
import { ForgotPasswordForm } from "../auth-forms";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="font-display text-2xl font-semibold">Mot de passe oublié</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Indiquez votre adresse : vous recevrez un lien valable une heure.</p>
      <ForgotPasswordForm />
    </>
  );
}
