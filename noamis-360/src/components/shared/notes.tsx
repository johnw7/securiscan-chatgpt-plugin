import { StickyNote, Trash2 } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";
import { EntityForm } from "@/components/ui/entity-form";
import { EmptyState } from "@/components/ui/misc";
import { addNote, deleteNote } from "@/features/pilot/actions";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";

/** Notes internes (jamais visibles des clients — aucune politique RLS client). */
export async function InternalNotes({ scope }: { scope: { client_id?: string; mission_id?: string; lead_id?: string } }) {
  const supabase = await createClient();
  let q = supabase.from("notes").select("id, body, created_at, author_id, profiles(full_name, email)").order("created_at", { ascending: false });
  if (scope.client_id) q = q.eq("client_id", scope.client_id);
  if (scope.mission_id) q = q.eq("mission_id", scope.mission_id);
  if (scope.lead_id) q = q.eq("lead_id", scope.lead_id);
  const { data } = await q;
  return (
    <div className="space-y-5">
      <EntityForm
        schema="note"
        fields={[{ name: "body", label: "Nouvelle note interne", type: "textarea", rows: 3, required: true, hint: "Visible uniquement par l'équipe NOAMIS." }]}
        hidden={scope}
        action={addNote}
        submitLabel="Ajouter la note"
        successMessage="Note ajoutée"
        columns={1}
      />
      {data?.length ? (
        <ul className="space-y-3">
          {data.map((n) => {
            const p = n.profiles as { full_name: string | null; email: string } | null;
            return (
              <li key={n.id} className="rounded-lg border border-border bg-surface-2 p-4">
                <div className="mb-2 flex items-center justify-between gap-2 text-xs text-muted">
                  <span>
                    {p?.full_name || p?.email || "—"} · {formatDateTime(n.created_at)}
                  </span>
                  <ActionButton
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Supprimer la note"
                    action={deleteNote.bind(null, n.id)}
                    confirm={{ title: "Supprimer cette note ?", description: "Cette action est définitive.", danger: true, confirmLabel: "Supprimer" }}
                  >
                    <Trash2 />
                  </ActionButton>
                </div>
                <p className="whitespace-pre-wrap text-sm">{n.body}</p>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState icon={StickyNote} title="Aucune note" />
      )}
    </div>
  );
}
