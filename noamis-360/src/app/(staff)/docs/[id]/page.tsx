import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, ArchiveRestore, Download, ShieldAlert, Trash2, XCircle } from "lucide-react";
import { HistoryTimeline } from "@/components/shared/history";
import { ActionButton } from "@/components/ui/action-button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EntityForm } from "@/components/ui/entity-form";
import { DefinitionList, EmptyState, Notice, PageHeader } from "@/components/ui/misc";
import { deleteDocument, revokeShare, setArchived, updateDocument } from "@/features/docs/actions";
import { NewVersionButton, ShareDialog } from "@/features/docs/share-dialog";
import { getClientOptions, getMissionOptions } from "@/features/pilot/queries";
import { requireCapability } from "@/lib/auth/session";
import { CONFIDENTIALITY, DOC_CATEGORIES, optionsOf } from "@/lib/labels";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Document" };

const size = (b: number) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} Mo` : `${Math.ceil(b / 1024)} Ko`);

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireCapability("docs.manage");
  const { id } = await params;
  const supabase = await createClient();
  const { data: d } = await supabase.from("documents").select("*, clients(id, name), missions(id, reference)").eq("id", id).is("deleted_at", null).maybeSingle();
  if (!d) notFound();
  const [versions, shares, clients, missions] = await Promise.all([
    supabase.from("document_versions").select("*, profiles(full_name)").eq("document_id", id).order("version", { ascending: false }),
    supabase.from("document_shares").select("id, recipient, expires_at, max_downloads, download_count, revoked_at, created_at").eq("document_id", id).order("created_at", { ascending: false }),
    getClientOptions(),
    getMissionOptions(),
  ]);
  const shareable = d.category !== "rapport_audit" && d.confidentiality !== "restreint" && !d.audit_id && !d.archived_at;
  const now = new Date().toISOString();

  return (
    <>
      <PageHeader
        eyebrow="NOAMIS DOCS"
        title={d.title}
        description={
          <>
            {(d.clients as { id: string; name: string } | null) && <Link className="text-gold-text hover:underline" href={`/pilot/clients/${d.client_id}`}>{(d.clients as { name: string }).name}</Link>}
            {(d.missions as { id: string; reference: string } | null) && <> · <Link className="hover:underline" href={`/pilot/missions/${d.mission_id}`}>{(d.missions as { reference: string }).reference}</Link></>}
            {d.uploaded_by_client && <> · déposé par le client</>}
          </>
        }
        actions={
          <>
            <StatusBadge map={DOC_CATEGORIES} value={d.category} />
            <StatusBadge map={CONFIDENTIALITY} value={d.confidentiality} />
            {d.archived_at ? (
              <ActionButton variant="secondary" action={setArchived.bind(null, d.id, false)}><ArchiveRestore /> Restaurer</ActionButton>
            ) : (
              <ActionButton variant="secondary" action={setArchived.bind(null, d.id, true)} confirm={{ title: "Archiver ce document ?", description: "Il reste consultable ; ses liens de partage sont révoqués.", confirmLabel: "Archiver" }}><Archive /> Archiver</ActionButton>
            )}
            {can(session.role, "mission.delete") && (
              <ActionButton variant="ghost" action={deleteDocument.bind(null, d.id)} redirectTo="/docs" confirm={{ title: "Supprimer ce document ?", description: "Suppression logique : le document disparaît des listes et du portail ; les versions sont conservées pour l'historique.", danger: true, confirmLabel: "Supprimer" }}><Trash2 /> Supprimer</ActionButton>
            )}
          </>
        }
      />
      {d.category === "rapport_audit" && <div className="mb-6"><Notice tone="danger" title="Rapport de sûreté">Ce document décrit des vulnérabilités : il n&apos;est accessible qu&apos;aux personnes habilitées et ne peut jamais être partagé par lien public.</Notice></div>}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader title="Versions" description="Chaque version est conservée et immuable (empreinte SHA-256)." action={!d.archived_at && <NewVersionButton documentId={d.id} />} />
            <CardBody className="p-0">
              {versions.data?.length ? (
                <ul className="divide-y divide-border">
                  {versions.data.map((v) => (
                    <li key={v.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                      <Badge tone={v.version === d.current_version ? "gold" : "neutral"}>v{v.version}</Badge>
                      <div className="min-w-0 flex-1">
                        <p className="truncate">{v.file_name}</p>
                        <p className="text-xs text-muted">{formatDateTime(v.created_at)} · {(v.profiles as { full_name: string | null } | null)?.full_name ?? "—"} · {size(v.size_bytes)}{v.comment ? ` · ${v.comment}` : ""}</p>
                        <p className="truncate font-mono text-[10px] text-muted" title="Empreinte SHA-256">{v.sha256}</p>
                      </div>
                      <a href={`/api/documents/${d.id}/download?version=${v.version}`} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-gold-text hover:bg-surface-2"><Download className="size-4" /> Télécharger</a>
                    </li>
                  ))}
                </ul>
              ) : <div className="p-5"><EmptyState title="Aucune version" /></div>}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Métadonnées et permissions" />
            <CardBody>
              <EntityForm
                schema="document"
                fields={[
                  { name: "title", label: "Titre", required: true, wide: true },
                  { name: "category", label: "Catégorie", type: "select", options: optionsOf(DOC_CATEGORIES), required: true },
                  { name: "confidentiality", label: "Confidentialité", type: "select", options: optionsOf(CONFIDENTIALITY), required: true },
                  { name: "client_id", label: "Client", type: "select", options: clients },
                  { name: "mission_id", label: "Mission", type: "select", options: missions },
                  { name: "tags", label: "Mots-clés", wide: true },
                  { name: "description", label: "Description", type: "textarea", rows: 3 },
                  { name: "client_visible", label: "Visible dans le portail du client", type: "checkbox" },
                ]}
                defaultValues={d}
                hidden={{ id: d.id, project_id: d.project_id ?? "" }}
                action={updateDocument}
              />
            </CardBody>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Partage contrôlé" as="h3" action={<ShareDialog documentId={d.id} disabled={!shareable} />} />
            <CardBody className="space-y-3">
              {!shareable && <p className="flex items-start gap-2 text-xs text-muted"><ShieldAlert className="size-4 shrink-0 text-warning" /> Partage par lien indisponible (rapport de sûreté, document restreint ou archivé).</p>}
              {shares.data?.length ? (
                <ul className="space-y-2 text-sm">
                  {shares.data.map((s) => {
                    const active = !s.revoked_at && s.expires_at > now && s.download_count < s.max_downloads;
                    return (
                      <li key={s.id} className="rounded-lg border border-border p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate">{s.recipient ?? "Destinataire non précisé"}</span>
                          <Badge tone={active ? "success" : "neutral"}>{s.revoked_at ? "Révoqué" : active ? "Actif" : "Expiré"}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted">Expire le {formatDateTime(s.expires_at)} · {s.download_count}/{s.max_downloads} téléchargement(s)</p>
                        {active && <ActionButton size="sm" variant="ghost" className="mt-1" action={revokeShare.bind(null, d.id, s.id)}><XCircle /> Révoquer</ActionButton>}
                      </li>
                    );
                  })}
                </ul>
              ) : <p className="text-sm text-muted">Aucun lien créé.</p>}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Informations" as="h3" />
            <CardBody>
              <DefinitionList items={[{ label: "Créé le", value: formatDateTime(d.created_at) }, { label: "Modifié le", value: formatDateTime(d.updated_at) }, { label: "Archivé le", value: d.archived_at ? formatDateTime(d.archived_at) : "—" }, { label: "Mots-clés", value: d.tags.join(", ") || "—" }]} />
            </CardBody>
          </Card>
          <Card><CardHeader title="Historique" as="h3" /><CardBody><HistoryTimeline session={session} entityType="documents" entityId={d.id} /></CardBody></Card>
        </div>
      </div>
    </>
  );
}
