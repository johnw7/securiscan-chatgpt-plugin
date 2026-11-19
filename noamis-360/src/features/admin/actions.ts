"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { check, guarded } from "@/lib/actions";
import { publicEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { assignableRoles, type Role } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth/session";
import { fail, type ActionResult } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { fieldErrors, uuid } from "@/lib/validation/common";
import { inviteSchema, orgSchema, profileSchema } from "./schemas";

/** Lien d'activation à usage unique (aucune dépendance à l'envoi d'e-mails). */
async function activationLink(email: string, type: "invite" | "recovery") {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({ type: type === "invite" ? "magiclink" : "recovery", email });
  if (error || !data.properties?.hashed_token) throw error ?? new Error("generateLink");
  const otpType = type === "invite" ? "magiclink" : "recovery";
  return `${publicEnv().NEXT_PUBLIC_SITE_URL}/auth/confirm?token_hash=${data.properties.hashed_token}&type=${otpType}&next=/reset-password`;
}

/**
 * Invitation d'un utilisateur : création du compte (sans mot de passe utilisable),
 * adhésion avec le rôle choisi (contrôlée par la RLS : administrateur MFA,
 * super-admin pour créer un super-admin), puis lien d'activation à transmettre.
 */
export async function inviteUser(input: unknown) {
  return guarded("admin.users", inviteSchema, input, async (d, { supabase, session }) => {
    if (!assignableRoles(session.role).includes(d.role as Role)) return { ok: false, error: "Vous ne pouvez pas attribuer ce rôle." };
    const admin = createAdminClient();
    const { data: existing } = await supabase.from("profiles").select("id").eq("email", d.email).maybeSingle();
    let userId = existing?.id;
    if (!userId) {
      const { data: created, error } = await admin.auth.admin.createUser({ email: d.email, email_confirm: true, user_metadata: { full_name: d.full_name } });
      if (error || !created.user) {
        logger.warn("admin.invite_create_failed", { code: error?.code });
        return { ok: false, error: "Création du compte impossible (adresse déjà utilisée ?)." };
      }
      userId = created.user.id;
    }
    const { error } = await supabase.from("memberships").insert({ organization_id: session.organizationId, user_id: userId, role: d.role, client_id: d.client_id });
    if (error) {
      if (!existing) await admin.auth.admin.deleteUser(userId);
      throw error;
    }
    const link = await activationLink(d.email, "invite");
    revalidatePath("/admin/users");
    return { ok: true, data: { link }, message: "Compte créé : transmettez le lien d'activation à la personne (valable 1 heure)." };
  });
}

export async function changeRole(membershipId: string, role: string) {
  return guarded("admin.users", z.object({ id: uuid, role: z.enum(["super_admin", "admin", "collaborator"]) }), { id: membershipId, role }, async (d, { supabase, session }) => {
    if (!assignableRoles(session.role).includes(d.role)) return { ok: false, error: "Vous ne pouvez pas attribuer ce rôle." };
    const m = check(await supabase.from("memberships").select("user_id, role").eq("id", d.id).single());
    if (m.user_id === session.userId) return { ok: false, error: "Vous ne pouvez pas modifier votre propre rôle." };
    if (m.role === "client") return { ok: false, error: "Un compte client ne peut pas devenir un compte NOAMIS." };
    check(await supabase.from("memberships").update({ role: d.role }).eq("id", d.id).select("id").single());
    revalidatePath("/admin/users");
    return { ok: true };
  });
}

export async function setMembershipActive(membershipId: string, active: boolean) {
  return guarded("admin.users", uuid, membershipId, async (id, { supabase, session }) => {
    const m = check(await supabase.from("memberships").select("user_id").eq("id", id).single());
    if (m.user_id === session.userId) return { ok: false, error: "Vous ne pouvez pas désactiver votre propre accès." };
    check(await supabase.from("memberships").update({ active }).eq("id", id).select("id").single());
    // Déconnexion immédiate de toutes les sessions de l'utilisateur désactivé.
    if (!active) await createAdminClient().auth.admin.signOut(m.user_id, "global").catch(() => undefined);
    revalidatePath("/admin/users");
    return { ok: true, message: active ? "Accès réactivé" : "Accès désactivé et sessions révoquées" };
  });
}

export async function resetLink(membershipId: string) {
  return guarded("admin.users", uuid, membershipId, async (id, { supabase }) => {
    const m = check(await supabase.from("memberships").select("profiles(email)").eq("id", id).single());
    const email = (m.profiles as { email: string } | null)?.email;
    if (!email) return { ok: false, error: "Adresse introuvable" };
    return { ok: true, data: { link: await activationLink(email, "recovery") }, message: "Lien de réinitialisation généré (valable 1 heure)." };
  });
}

export async function saveOrganization(input: unknown) {
  return guarded("admin.organization", orgSchema, input, async (d, { supabase, session }) => {
    const current = check(await supabase.from("organizations").select("numbering, invoice_settings").eq("id", session.organizationId).single());
    const numbering = {
      ...(current.numbering as Record<string, unknown>),
      quote: { prefix: d.quote_prefix, padding: 4 },
      invoice: { prefix: d.invoice_prefix, padding: 4 },
      credit: { prefix: d.credit_prefix, padding: 4 },
    };
    const invoice_settings = { ...(current.invoice_settings as Record<string, unknown>), payment_terms_days: d.payment_terms_days, late_penalty_rate: d.late_penalty_rate };
    const { quote_prefix: _q, invoice_prefix: _i, credit_prefix: _c, payment_terms_days: _p, late_penalty_rate: _l, ...values } = d;
    void [_q, _i, _c, _p, _l];
    check(await supabase.from("organizations").update({ ...values, numbering, invoice_settings }).eq("id", session.organizationId).select("id").single());
    revalidatePath("/admin/organization");
    return { ok: true, message: "Organisation mise à jour" };
  });
}

/** Mise à jour de son propre profil (tout utilisateur connecté, RLS : uniquement sa ligne). */
export async function saveProfile(input: unknown): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Session expirée." };
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Certains champs sont invalides.", fieldErrors: fieldErrors(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", session.userId);
  if (error) return fail(error);
  revalidatePath("/account");
  return { ok: true, message: "Profil mis à jour" };
}
