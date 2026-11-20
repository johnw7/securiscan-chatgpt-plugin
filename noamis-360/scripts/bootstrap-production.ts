/**
 * Initialisation d'un environnement NOAMIS 360° vierge (préproduction ou production).
 * Crée UNIQUEMENT des données de configuration, jamais de données fictives :
 *   - l'organisation par défaut (NOAMIS Sûreté Conseil) ;
 *   - le compte super-administrateur (lien d'activation à usage unique) ;
 *   - le modèle d'audit par défaut (méthode de cotation NOAMIS).
 *
 * Usage (variables lues dans l'environnement, jamais en argument) :
 *   NEXT_PUBLIC_SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… NEXT_PUBLIC_SITE_URL=https://… \
 *   ADMIN_EMAIL=… ADMIN_NAME="…" node scripts/bootstrap-production.ts
 */
import { createClient } from "@supabase/supabase-js";
import { DEFAULT_TEMPLATE } from "../src/features/audit/default-template.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const site = process.env.NEXT_PUBLIC_SITE_URL;
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const name = process.env.ADMIN_NAME?.trim();
if (!url || !key || !site || !email || !name) {
  console.error("Variables requises : NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SITE_URL, ADMIN_EMAIL, ADMIN_NAME");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const { data: existing } = await db.from("organizations").select("id, name").eq("is_default", true).maybeSingle();
  if (existing) {
    console.log(`Organisation déjà initialisée (${existing.name}). Aucune modification.`);
    return;
  }
  const { data: org, error: orgErr } = await db
    .from("organizations")
    .insert({
      name: "NOAMIS Sûreté Conseil",
      legal_form: "Entrepreneur individuel",
      siren: "907525158",
      postal_code: "78100",
      city: "Saint-Germain-en-Laye",
      email: "contact@noamis.fr",
      website: "https://www.noamis.fr/",
      vat_regime: "franchise",
      is_default: true,
    })
    .select("id")
    .single();
  if (orgErr) throw orgErr;

  const { data: created, error: userErr } = await db.auth.admin.createUser({ email: email!, email_confirm: true, user_metadata: { full_name: name } });
  if (userErr || !created.user) throw userErr ?? new Error("Création du compte impossible");
  const { error: mErr } = await db.from("memberships").insert({ organization_id: org.id, user_id: created.user.id, role: "super_admin" });
  if (mErr) throw mErr;

  const { error: tErr } = await db.from("audit_templates").insert({
    organization_id: org.id,
    name: DEFAULT_TEMPLATE.name,
    description: DEFAULT_TEMPLATE.description,
    categories: DEFAULT_TEMPLATE.categories,
    questions: DEFAULT_TEMPLATE.questions,
    scoring: DEFAULT_TEMPLATE.scoring,
  });
  if (tErr) throw tErr;

  const { data: link, error: lErr } = await db.auth.admin.generateLink({ type: "magiclink", email: email! });
  if (lErr || !link.properties?.hashed_token) throw lErr ?? new Error("Lien d'activation impossible");
  console.log("Initialisation terminée.");
  console.log("Lien d'activation du super-administrateur (usage unique, 1 heure) :");
  console.log(`${site}/auth/confirm?token_hash=${link.properties.hashed_token}&type=magiclink&next=/reset-password`);
  console.log("Étapes suivantes : définir le mot de passe, activer la double authentification, compléter Administration → Organisation.");
}

main().catch((e) => {
  console.error("Échec :", e instanceof Error ? e.message : e);
  process.exit(1);
});
