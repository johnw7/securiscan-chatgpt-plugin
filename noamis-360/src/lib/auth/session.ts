import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { can, isAdminRole, isStaffRole, requiresMfa, type Capability, type Role } from "@/lib/permissions";

export type SessionContext = {
  userId: string;
  email: string;
  fullName: string;
  role: Role;
  organizationId: string;
  organizationName: string;
  clientId: string | null;
  aal: "aal1" | "aal2";
  mfaEnrolled: boolean;
};

/**
 * Couche d'accès aux données (DAL) : lit et vérifie la session côté serveur.
 * `getClaims()` valide la signature du JWT ; aucune donnée cliente n'est crue.
 */
export const getSession = cache(async (): Promise<SessionContext | null> => {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (!claims?.sub) return null;

  const [{ data: membership }, { data: profile }, { data: aalData }] = await Promise.all([
    supabase
      .from("memberships")
      .select("role, organization_id, client_id, organizations(name)")
      .eq("user_id", claims.sub)
      .eq("active", true)
      .order("created_at")
      .limit(1)
      .maybeSingle(),
    supabase.from("profiles").select("full_name, email").eq("id", claims.sub).maybeSingle(),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);

  if (!membership) return null;

  return {
    userId: claims.sub,
    email: profile?.email ?? (claims.email as string | undefined) ?? "",
    fullName: profile?.full_name ?? profile?.email ?? "Utilisateur",
    role: membership.role as Role,
    organizationId: membership.organization_id,
    organizationName: (membership.organizations as { name: string } | null)?.name ?? "NOAMIS",
    clientId: membership.client_id,
    aal: (aalData?.currentLevel ?? "aal1") as "aal1" | "aal2",
    mfaEnrolled: aalData?.nextLevel === "aal2",
  };
});

/** Session obligatoire ; sinon redirection vers la connexion. */
export async function requireUser(): Promise<SessionContext> {
  const session = await getSession();
  if (!session) redirect("/login?error=no_access");
  return session;
}

/** Applique la double authentification aux rôles qui l'exigent. */
function enforceMfa(session: SessionContext) {
  if (requiresMfa(session.role) && session.aal !== "aal2") {
    redirect(session.mfaEnrolled ? "/mfa" : "/mfa/enroll");
  }
}

/** Espace NOAMIS (personnel uniquement). */
export async function requireStaff(): Promise<SessionContext> {
  const session = await requireUser();
  if (!isStaffRole(session.role)) redirect("/portal");
  enforceMfa(session);
  return session;
}

export async function requireAdmin(): Promise<SessionContext> {
  const session = await requireStaff();
  if (!isAdminRole(session.role)) redirect("/dashboard?error=forbidden");
  return session;
}

export async function requireCapability(capability: Capability): Promise<SessionContext> {
  const session = await requireUser();
  if (session.role !== "client") enforceMfa(session);
  if (!can(session.role, capability)) {
    redirect(session.role === "client" ? "/portal?error=forbidden" : "/dashboard?error=forbidden");
  }
  return session;
}

/** Portail client (NOAMIS CONNECT). */
export async function requireClient(): Promise<SessionContext & { clientId: string }> {
  const session = await requireUser();
  if (session.role !== "client" || !session.clientId) redirect("/dashboard");
  return session as SessionContext & { clientId: string };
}

/**
 * Variante pour les Server Actions et Route Handlers : ne redirige pas,
 * renvoie null si l'utilisateur n'a pas la capacité demandée.
 */
export async function authorize(capability: Capability): Promise<SessionContext | null> {
  const session = await getSession();
  if (!session) return null;
  if (requiresMfa(session.role) && session.aal !== "aal2") return null;
  return can(session.role, capability) ? session : null;
}
