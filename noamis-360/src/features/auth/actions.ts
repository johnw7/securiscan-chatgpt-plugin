"use server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { safeInternalPath } from "@/lib/utils";
import { publicEnv } from "@/lib/env";
import { passwordSchema } from "@/lib/validation/common";

export type AuthState = { error?: string; message?: string } | undefined;

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Adresse e-mail invalide").max(254),
  password: z.string().min(1, "Mot de passe requis").max(200),
  next: z.string().optional(),
});

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  if (error) {
    logger.warn("auth.login_failed", { reason: error.code ?? error.status });
    // Message volontairement générique (pas d'énumération des comptes).
    return { error: "Identifiants incorrects ou compte inactif." };
  }
  redirect(safeInternalPath(parsed.data.next, "/home"));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

const emailSchema = z.object({ email: z.string().trim().toLowerCase().email("Adresse e-mail invalide").max(254) });

export async function requestPasswordReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = emailSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? publicEnv().NEXT_PUBLIC_SITE_URL;
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });
  if (error) logger.warn("auth.reset_request_failed", { status: error.status });
  // Réponse identique que le compte existe ou non.
  return { message: "Si un compte correspond à cette adresse, un lien de réinitialisation vient d'être envoyé." };
}

const updatePasswordSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { message: "Les mots de passe ne correspondent pas", path: ["confirm"] });

export async function updatePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = updatePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return { error: "Session expirée : recommencez la procédure." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    logger.warn("auth.password_update_failed", { code: error.code });
    return { error: error.code === "same_password" ? "Choisissez un mot de passe différent de l'actuel." : "Mot de passe refusé : il est peut-être trop faible ou compromis." };
  }
  return { message: "Mot de passe mis à jour." };
}

export async function setTheme(theme: "dark" | "light") {
  (await cookies()).set("noamis-theme", theme === "light" ? "light" : "dark", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  });
}
