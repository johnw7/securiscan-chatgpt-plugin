import type { Metadata } from "next";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState, Notice, PageHeader } from "@/components/ui/misc";
import { requireCapability } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Journal d'audit" };

const ACTIONS: Record<string, string> = { insert: "Création", update: "Modification", delete: "Suppression" };

export default async function AuditLogsPage({ searchParams }: { searchParams: Promise<{ entity?: string; page?: string }> }) {
  await requireCapability("admin.audit_logs");
  const sp = await searchParams;
  const page = Math.max(0, Number(sp.page ?? 0) || 0);
  const supabase = await createClient();
  let q = supabase.from("audit_logs").select("id, action, entity_type, entity_id, changes, created_at, actor_id").order("id", { ascending: false }).range(page * 100, page * 100 + 99);
  if (sp.entity && /^[a-z_]{3,40}$/.test(sp.entity)) q = q.eq("entity_type", sp.entity);
  const { data } = await q;
  const actorIds = [...new Set((data ?? []).map((d) => d.actor_id).filter(Boolean))] as string[];
  const { data: actors } = actorIds.length ? await supabase.from("profiles").select("id, full_name, email").in("id", actorIds) : { data: [] };
  const names = new Map((actors ?? []).map((a) => [a.id, a.full_name || a.email]));
  const entities = ["clients", "missions", "audits", "projects", "quotes", "invoices", "payments", "documents", "document_shares", "memberships", "organizations", "intelligence_reports"];
  return (
    <>
      <PageHeader eyebrow="Administration" title="Journal d'audit" description="Trace inaltérable (ajout seul) des opérations sensibles : qui, quoi, quand, valeurs avant/après. Les secrets et contenus volumineux ne sont jamais journalisés." />
      <form className="mb-4 flex flex-wrap items-center gap-2 text-sm" method="get">
        <label htmlFor="entity" className="text-muted">Type d&apos;élément</label>
        <select id="entity" name="entity" defaultValue={sp.entity ?? ""} className="h-9 rounded-lg border border-border bg-surface-2 px-2">
          <option value="">Tous</option>
          {entities.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <button type="submit" className="h-9 rounded-lg border border-border px-3 hover:bg-surface-2">Filtrer</button>
      </form>
      {data?.length ? (
        <Card>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Journal d&apos;audit</caption>
                <thead><tr className="border-b border-border text-left text-xs uppercase text-muted"><th className="px-4 py-3">Date</th><th className="px-4 py-3">Auteur</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Élément</th><th className="px-4 py-3">Champs</th></tr></thead>
                <tbody>
                  {data.map((l) => (
                    <tr key={l.id} className="border-b border-border/60 align-top">
                      <td className="whitespace-nowrap px-4 py-2 text-muted">{formatDateTime(l.created_at)}</td>
                      <td className="px-4 py-2">{l.actor_id ? names.get(l.actor_id) ?? "Utilisateur" : "Système"}</td>
                      <td className="px-4 py-2">{ACTIONS[l.action] ?? l.action}</td>
                      <td className="px-4 py-2"><span className="font-mono text-xs">{l.entity_type}</span><span className="block font-mono text-[10px] text-muted">{l.entity_id}</span></td>
                      <td className="max-w-md px-4 py-2 text-xs text-muted">{Object.keys((l.changes ?? {}) as object).filter((k) => !["id", "organization_id", "created_at"].includes(k)).slice(0, 10).join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      ) : <EmptyState title="Aucune entrée" />}
      <div className="mt-4 flex justify-between text-sm">
        {page > 0 ? <a className="text-gold-text hover:underline" href={`?page=${page - 1}${sp.entity ? `&entity=${sp.entity}` : ""}`}>← Plus récents</a> : <span />}
        {(data?.length ?? 0) === 100 && <a className="text-gold-text hover:underline" href={`?page=${page + 1}${sp.entity ? `&entity=${sp.entity}` : ""}`}>Plus anciens →</a>}
      </div>
      <div className="mt-6"><Notice tone="info">Ce journal est protégé contre toute modification ou suppression, y compris par les administrateurs (déclencheur de base de données).</Notice></div>
    </>
  );
}
