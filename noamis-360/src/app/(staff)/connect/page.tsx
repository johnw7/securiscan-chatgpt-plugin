import type { Metadata } from "next";
import Link from "next/link";
import { MessagesSquare, Plus, UserPlus } from "lucide-react";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { FormDialog } from "@/components/ui/entity-form";
import { EmptyState, Notice, PageHeader, StatCard } from "@/components/ui/misc";
import { requestApproval } from "@/features/connect/actions";
import { getClientOptions, getMissionOptions } from "@/features/pilot/queries";
import { requireCapability } from "@/lib/auth/session";
import { APPROVAL_STATUS } from "@/lib/labels";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Portail clients" };

export default async function ConnectPage() {
  const session = await requireCapability("connect.manage");
  const supabase = await createClient();
  const [{ data: accounts }, { data: unread }, { data: approvals }, clients, missions, { data: docs }] = await Promise.all([
    supabase.from("memberships").select("client_id, active, profiles(full_name, email), clients(name)").eq("role", "client"),
    supabase.from("messages").select("client_id, clients(name)").eq("from_client", true).is("read_by_staff_at", null),
    supabase.from("client_approvals").select("id, title, status, created_at, responded_at, response_comment, clients(name)").order("created_at", { ascending: false }).limit(50),
    getClientOptions(),
    getMissionOptions(),
    supabase.from("documents").select("id, title").eq("client_visible", true).is("deleted_at", null).order("updated_at", { ascending: false }).limit(200),
  ]);
  const unreadByClient = new Map<string, { name: string; count: number }>();
  for (const m of unread ?? []) {
    const cur = unreadByClient.get(m.client_id) ?? { name: (m.clients as { name: string } | null)?.name ?? "—", count: 0 };
    unreadByClient.set(m.client_id, { ...cur, count: cur.count + 1 });
  }
  return (
    <>
      <PageHeader
        eyebrow="NOAMIS CONNECT"
        title="Portail clients"
        description="Espace sécurisé où chaque client suit ses missions, télécharge ses livrables, consulte devis et factures, échange et valide — sans jamais accéder aux données d'un autre client."
        actions={
          <>
            <Button asChild variant="secondary"><Link href="/connect/messages"><MessagesSquare /> Messagerie</Link></Button>
            {can(session.role, "admin.users") && <Button asChild variant="secondary"><Link href="/admin/users"><UserPlus /> Inviter un client</Link></Button>}
            <FormDialog
              title="Demander une validation"
              description="Le client reçoit une notification et répond depuis son portail (validation d'un livrable, d'une étape, d'un choix)."
              size="lg"
              trigger={<Button><Plus /> Demande de validation</Button>}
              schema="approval"
              fields={[
                { name: "title", label: "Objet", required: true, wide: true },
                { name: "client_id", label: "Client", type: "select", options: clients, required: true },
                { name: "mission_id", label: "Mission", type: "select", options: missions },
                { name: "document_id", label: "Document à valider", type: "select", options: (docs ?? []).map((d) => ({ value: d.id, label: d.title })) },
                { name: "description", label: "Détail", type: "textarea", rows: 3 },
              ]}
              action={requestApproval}
            />
          </>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Comptes clients actifs" value={(accounts ?? []).filter((a) => a.active).length} />
        <StatCard label="Messages non lus" value={unread?.length ?? 0} tone={unread?.length ? "warning" : "gold"} />
        <StatCard label="Validations en attente" value={(approvals ?? []).filter((a) => a.status === "en_attente").length} tone="info" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Messages clients non lus" />
          <CardBody className="p-0">
            {unreadByClient.size ? (
              <ul className="divide-y divide-border">
                {[...unreadByClient.entries()].map(([id, v]) => (
                  <li key={id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <Link href={`/connect/messages?client=${id}`} className="hover:text-gold-text">{v.name}</Link>
                    <Badge tone="warning">{v.count}</Badge>
                  </li>
                ))}
              </ul>
            ) : <div className="p-5"><EmptyState title="Aucun message en attente" /></div>}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Validations demandées" />
          <CardBody className="p-0">
            {approvals?.length ? (
              <ul className="divide-y divide-border">
                {approvals.map((a) => (
                  <li key={a.id} className="px-5 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="flex-1 font-medium">{a.title}</span>
                      <StatusBadge map={APPROVAL_STATUS} value={a.status} />
                    </div>
                    <p className="text-xs text-muted">{(a.clients as { name: string } | null)?.name} · demandé le {formatDateTime(a.created_at)}{a.responded_at ? ` · réponse le ${formatDateTime(a.responded_at)}` : ""}</p>
                    {a.response_comment && <p className="mt-1 text-xs italic text-muted">« {a.response_comment} »</p>}
                  </li>
                ))}
              </ul>
            ) : <div className="p-5"><EmptyState title="Aucune demande" /></div>}
          </CardBody>
        </Card>
      </div>
      <div className="mt-6"><Notice tone="gold">Ce que voit un client : ses missions marquées « visibles », les tâches et échéances partagées, les documents partagés, ses devis envoyés et factures émises, les rapports de veille qui lui sont diffusés et les recommandations de ses audits validés.</Notice></div>
    </>
  );
}
