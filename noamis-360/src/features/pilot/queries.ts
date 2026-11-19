import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/** Listes de référence pour les formulaires (déjà filtrées par la RLS). */
export const getStaffOptions = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("memberships")
    .select("user_id, role, profiles(full_name, email)")
    .in("role", ["super_admin", "admin", "collaborator"])
    .eq("active", true);
  return (data ?? []).map((m) => {
    const p = m.profiles as { full_name: string | null; email: string } | null;
    return { value: m.user_id, label: p?.full_name || p?.email || "Utilisateur" };
  });
});

export const getClientOptions = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.from("clients").select("id, name").is("deleted_at", null).order("name");
  return (data ?? []).map((c) => ({ value: c.id, label: c.name }));
});

export const getMissionOptions = cache(async (clientId?: string) => {
  const supabase = await createClient();
  let q = supabase.from("missions").select("id, reference, title, client_id").is("deleted_at", null).order("created_at", { ascending: false });
  if (clientId) q = q.eq("client_id", clientId);
  const { data } = await q;
  return (data ?? []).map((m) => ({ value: m.id, label: `${m.reference} — ${m.title}`, clientId: m.client_id }));
});

/** Historique des modifications d'une entité (journal d'audit, administrateurs). */
export async function getHistory(entityType: string, entityId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("audit_logs")
    .select("id, action, changes, created_at, actor_id")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })
    .limit(50);
  const actorIds = [...new Set((data ?? []).map((d) => d.actor_id).filter(Boolean))] as string[];
  const { data: actors } = actorIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", actorIds)
    : { data: [] as Array<{ id: string; full_name: string | null; email: string }> };
  const names = new Map((actors ?? []).map((a) => [a.id, a.full_name || a.email]));
  return (data ?? []).map((d) => ({ ...d, actor: d.actor_id ? (names.get(d.actor_id) ?? "Utilisateur") : "Système" }));
}
