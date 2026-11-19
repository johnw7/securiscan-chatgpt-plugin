"use client";
import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/misc";
import { requestPasswordReset, signIn, updatePassword, type AuthState } from "@/features/auth/actions";

function Feedback({ state }: { state: AuthState }) {
  if (state?.error) return <Notice tone="danger">{state.error}</Notice>;
  if (state?.message) return <Notice tone="gold">{state.message}</Notice>;
  return null;
}

export function LoginForm({ next, initialError }: { next?: string; initialError?: string }) {
  const [state, action, pending] = useActionState(signIn, initialError ? { error: initialError } : undefined);
  return (
    <form action={action} className="space-y-4" noValidate={false}>
      <input type="hidden" name="next" value={next ?? ""} />
      <Field id="email" label="Adresse e-mail" required>
        <Input name="email" type="email" autoComplete="username" required />
      </Field>
      <Field id="password" label="Mot de passe" required>
        <Input name="password" type="password" autoComplete="current-password" required />
      </Field>
      <Feedback state={state} />
      <Button type="submit" className="w-full" loading={pending}>
        Se connecter
      </Button>
      <p className="text-center text-sm">
        <Link href="/forgot-password" className="text-gold-text hover:underline">
          Mot de passe oublié ?
        </Link>
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);
  return (
    <form action={action} className="space-y-4">
      <Field id="email" label="Adresse e-mail" required>
        <Input name="email" type="email" autoComplete="email" required />
      </Field>
      <Feedback state={state} />
      <Button type="submit" className="w-full" loading={pending}>
        Recevoir un lien
      </Button>
      <p className="text-center text-sm">
        <Link href="/login" className="text-gold-text hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, undefined);
  return (
    <form action={action} className="space-y-4">
      <Field id="password" label="Nouveau mot de passe" hint="12 caractères minimum, avec majuscule, minuscule et chiffre." required>
        <Input name="password" type="password" autoComplete="new-password" minLength={12} required />
      </Field>
      <Field id="confirm" label="Confirmation" required>
        <Input name="confirm" type="password" autoComplete="new-password" minLength={12} required />
      </Field>
      <Feedback state={state} />
      {state?.message ? (
        <Button asChild className="w-full">
          <Link href="/home">Accéder à mon espace</Link>
        </Button>
      ) : (
        <Button type="submit" className="w-full" loading={pending}>
          Enregistrer
        </Button>
      )}
    </form>
  );
}
