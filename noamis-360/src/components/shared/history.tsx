import { History as HistoryIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/misc";
import { getHistory } from "@/features/pilot/queries";
import type { SessionContext } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { formatDateTime } from "@/lib/utils";

const ACTIONS: Record<string, string> = { insert: "Création", update: "Modification", delete: "Suppression" };
const HIDDEN = new Set(["id", "organization_id", "created_at", "created_by", "draft_version"]);

function short(v: unknown): string {
  if (v === null || v === undefined || v === "") return "∅";
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
  return s.length > 60 ? `${s.slice(0, 57)}…` : s;
}

/** Historique des modifications (journal d'audit en ajout seul). */
export async function HistoryTimeline({ session, entityType, entityId }: { session: SessionContext; entityType: string; entityId: string }) {
  if (!can(session.role, "admin.audit_logs")) {
    return <EmptyState icon={HistoryIcon} title="Historique réservé aux administrateurs" description="Le journal des modifications est consultable par les administrateurs NOAMIS (principe du moindre privilège)." />;
  }
  const entries = await getHistory(entityType, entityId);
  if (!entries.length) return <EmptyState icon={HistoryIcon} title="Aucune modification enregistrée" />;
  return (
    <ol className="relative space-y-4 border-l border-border pl-5">
      {entries.map((e) => {
        const changes = (e.changes ?? {}) as Record<string, unknown>;
        const keys = Object.keys(changes).filter((k) => !HIDDEN.has(k));
        return (
          <li key={e.id} className="relative">
            <span className="absolute -left-[25px] top-1.5 size-2.5 rounded-full bg-gold" aria-hidden />
            <p className="text-sm">
              <span className="font-medium">{ACTIONS[e.action] ?? e.action}</span> par {e.actor}
              <span className="text-muted"> · {formatDateTime(e.created_at)}</span>
            </p>
            {e.action === "update" && keys.length > 0 && (
              <ul className="mt-1 space-y-0.5 text-xs text-muted">
                {keys.slice(0, 8).map((k) => {
                  const c = changes[k] as { from?: unknown; to?: unknown };
                  return (
                    <li key={k}>
                      <span className="text-foreground">{k}</span> : {short(c?.from)} → {short(c?.to)}
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        );
      })}
    </ol>
  );
}
