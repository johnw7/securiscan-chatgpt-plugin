import type { Metadata } from "next";
import { Notice, PageHeader, StatCard } from "@/components/ui/misc";
import { DocumentsTable } from "@/features/docs/table";
import { UploadDialog } from "@/features/docs/upload";
import { getClientOptions, getMissionOptions } from "@/features/pilot/queries";
import { requireCapability } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Documents" };

export default async function DocsPage({ searchParams }: { searchParams: Promise<{ client?: string; mission?: string; upload?: string }> }) {
  await requireCapability("docs.manage");
  const sp = await searchParams;
  const supabase = await createClient();
  let q = supabase
    .from("documents")
    .select("id, title, category, confidentiality, client_visible, client_id, mission_id, current_version, updated_at, archived_at, tags, description, clients(name), missions(reference)")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(1000);
  if (sp.client && /^[0-9a-f-]{36}$/.test(sp.client)) q = q.eq("client_id", sp.client);
  if (sp.mission && /^[0-9a-f-]{36}$/.test(sp.mission)) q = q.eq("mission_id", sp.mission);
  const [{ data }, clients, missions] = await Promise.all([q, getClientOptions(), getMissionOptions()]);
  const rows = (data ?? []).map((d) => ({
    id: d.id, title: d.title, category: d.category, confidentiality: d.confidentiality, client_visible: d.client_visible, client_id: d.client_id,
    mission_id: d.mission_id, version: d.current_version, updated_at: d.updated_at, archived: Boolean(d.archived_at), tags: d.tags, description: d.description,
    client: (d.clients as { name: string } | null)?.name ?? null, mission: (d.missions as { reference: string } | null)?.reference ?? null,
  }));
  return (
    <>
      <PageHeader
        eyebrow="NOAMIS DOCS"
        title="Gestion documentaire"
        description="Documents confidentiels classés par client et mission, versionnés, avec téléchargements autorisés côté serveur et liens de partage temporaires."
        actions={<UploadDialog mode="staff" clients={clients} missions={missions} defaults={{ client_id: sp.client, mission_id: sp.mission }} open={sp.upload === "1"} />}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Documents" value={rows.filter((r) => !r.archived).length} />
        <StatCard label="Partagés avec les clients" value={rows.filter((r) => r.client_visible).length} tone="info" />
        <StatCard label="Pièces déposées par les clients" value={rows.filter((r) => r.category === "piece_client").length} tone="success" />
      </div>
      {(sp.client || sp.mission) && <div className="mb-4"><Notice tone="info">Liste filtrée sur {sp.mission ? "une mission" : "un client"}. <a className="text-gold-text underline" href="/docs">Afficher tout</a></Notice></div>}
      <DocumentsTable rows={rows} />
    </>
  );
}
