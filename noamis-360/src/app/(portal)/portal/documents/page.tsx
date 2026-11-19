import type { Metadata } from "next";
import { Download, FileText } from "lucide-react";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState, Notice, PageHeader } from "@/components/ui/misc";
import { UploadDialog } from "@/features/docs/upload";
import { requireClient } from "@/lib/auth/session";
import { DOC_CATEGORIES } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Mes documents" };

export default async function PortalDocuments() {
  await requireClient();
  const supabase = await createClient();
  const [{ data }, { data: missions }] = await Promise.all([
    supabase.from("documents").select("id, title, category, description, current_version, updated_at, uploaded_by_client, missions(reference)").order("updated_at", { ascending: false }),
    supabase.from("missions").select("id, reference, title"),
  ]);
  return (
    <>
      <PageHeader
        eyebrow="NOAMIS CONNECT"
        title="Mes documents"
        description="Livrables, rapports et pièces partagés par NOAMIS, ainsi que les documents que vous avez déposés."
        actions={<UploadDialog mode="client" missions={(missions ?? []).map((m) => ({ value: m.id, label: `${m.reference} — ${m.title}` }))} />}
      />
      <div className="mb-4"><Notice tone="gold">Les téléchargements utilisent des liens sécurisés à usage immédiat. Les rapports de sûreté sont confidentiels : ne les transférez pas hors de votre organisation.</Notice></div>
      {data?.length ? (
        <Card>
          <CardBody className="p-0">
            <ul className="divide-y divide-border">
              {data.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                  <FileText className="size-4 text-gold-text" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{d.title}</p>
                    <p className="text-xs text-muted">{(d.missions as { reference: string } | null)?.reference ?? "Général"} · v{d.current_version} · {formatDate(d.updated_at)}</p>
                  </div>
                  {d.uploaded_by_client ? <Badge tone="info">Déposé par vous</Badge> : <StatusBadge map={DOC_CATEGORIES} value={d.category} />}
                  <a href={`/api/documents/${d.id}/download`} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-gold-text hover:bg-surface-2"><Download className="size-4" /> Télécharger</a>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ) : (
        <EmptyState icon={FileText} title="Aucun document" />
      )}
    </>
  );
}
