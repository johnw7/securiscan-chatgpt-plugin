import { createClient } from "@supabase/supabase-js";
import { expect, type Page } from "@playwright/test";
import { totp } from "../helpers/totp";

export const PASSWORD = "Noamis-Dev-2026!";
export const USERS = {
  consultant: "consultant@noamis.test",
  analyst: "analyste@noamis.test",
  admin: "admin@noamis.test",
  clientA: "client.a@exemple.test",
  clientB: "client.b@exemple.test",
};

export const service = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321", process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

export async function login(page: Page, email: string, expectPath?: RegExp) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
  if (expectPath) await expect(page).toHaveURL(expectPath);
}

/** Connexion administrateur avec enrôlement TOTP (facteurs réinitialisés au préalable). */
export async function loginAdmin(page: Page, email = USERS.admin) {
  const svc = service();
  const { data: profile, error } = await svc.from("profiles").select("id").eq("email", email).single();
  if (error || !profile) throw new Error(`Utilisateur de test introuvable : ${email}`);
  const { data: factors } = await svc.auth.admin.mfa.listFactors({ userId: profile.id });
  for (const f of factors?.factors ?? []) await svc.auth.admin.mfa.deleteFactor({ userId: profile.id, id: f.id });

  await login(page, email, /\/mfa\/enroll/);
  await page.getByText("Saisie manuelle de la clé").click();
  const secret = (await page.locator("details code").textContent())!.trim();
  // Évite un code à cheval sur deux fenêtres de 30 s.
  if (Date.now() % 30_000 > 25_000) await page.waitForTimeout(30_000 - (Date.now() % 30_000) + 500);
  await page.getByLabel("Code de vérification").fill(totp(secret));
  await page.getByRole("button", { name: "Activer la double authentification" }).click();
  await page.waitForURL(/\/dashboard/);
}

export async function idOf(table: string, column: string, value: string): Promise<string> {
  const { data, error } = await service().from(table).select("id").eq(column, value).limit(1).single();
  if (error) throw error;
  return (data as { id: string }).id;
}
