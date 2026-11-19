import type { Metadata } from "next";
import { ClipboardCheck } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { respondApproval } from "@/features/connect/actions";
import { RespondButtons } from "@/features/connect/respond";
import { requireClient } from "@/lib/auth/session";
import { APPROVAL_STATUS } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Validations" };

export default async function PortalApprovals() {
  await requireClient();
  const supabase = await createClient();
  const { data } = await supabase.from("client_approvals").select("id, title, description, status, created_at, responded_at, response_comment, document_id, documents(title), missions(reference)").order("created_at", { ascending: false });
  const pending = (data ?? []).filter((a) => a.status === "en_attente");
  const done = (data ?? []).filter((a) => a.status !== "en_attente");
  return (
    <>
      <PageHeader eyebrow="NOAMIS CONNECT" title="Validations" description="Documents ou étapes soumis à votre accord." />
      {pending.length ? (
        <div className="space-y-4">
          {pending.map((a) => (
            <Card key={a.id}>
              <CardHeader title={a.title} description={`${(a.missions as { reference: string } | null)?.reference ?? ""} · demandé le ${formatDateTime(a.created_at)}`} action={<RespondButtons subject={a.title} action={respondApproval.bind(null, a.id)} />} />
              <CardBody className="space-y-2 text-sm">
                {a.description && <p className="whitespace-pre-wrap text-muted">{a.description}</p>}
                {a.document_id && <a className="text-gold-text hover:underline" href={`/api/documents/${a.document_id}/download`}>Consulter le document : {(a.documents as { title: string } | null)?.title ?? "document"}</a>}
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={ClipboardCheck} title="Aucune validation en attente" />
      )}
      {done.length > 0 && (
        <Card className="mt-6">
          <CardHeader title="Historique des validations" />
          <CardBody className="p-0">
            <ul className="divide-y divide-border">
              {done.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                  <span className="flex-1">{a.title}</span>
                  <span className="text-xs text-muted">{formatDateTime(a.responded_at)}</span>
                  <StatusBadge map={APPROVAL_STATUS} value={a.status} />
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}
    </>
  );
}
