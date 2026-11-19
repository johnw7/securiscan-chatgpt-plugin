import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Archive, BadgeCheck, Bot, ExternalLink, FileDown, Plus, SendHorizontal, Trash2 } from "lucide-react";
import { HistoryTimeline } from "@/components/shared/history";
import { ActionButton } from "@/components/ui/action-button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EntityForm, FormDialog } from "@/components/ui/entity-form";
import { Notice, PageHeader } from "@/components/ui/misc";
import { addReference, archiveReport, removeReference, saveReport, submitForReview, validateReport } from "@/features/intelligence/actions";
import { referenceFields, reportFields } from "@/features/intelligence/fields";
import { PublishForm } from "@/features/intelligence/publish-form";
import { getClientOptions } from "@/features/pilot/queries";
import { requireCapability } from "@/lib/auth/session";
import { CREDIBILITY, RELIABILITY, REPORT_KINDS, REPORT_STATUS, SEVERITY } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDateTime, todayISO } from "@/lib/utils";

export const metadata: Metadata = { title: "Rapport de veille" };

type Ref = { title: string; url: string; date: string; source: string; reliability: string; credibility: number };

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireCapability("intelligence.manage");
  const { id } = await params;
  const supabase = await createClient();
  const { data: r } = await supabase.from("intelligence_reports").select("*, validator:profiles!intelligence_reports_validated_by_fkey(full_name)").eq("id", id).maybeSingle();
  if (!r) notFound();
  const [{ data: recipients }, clients] = await Promise.all([
    supabase.from("intelligence_report_recipients").select("client_id, sent_at, clients(name)").eq("report_id", id),
    getClientOptions(),
  ]);
  const refs = (Array.isArray(r.source_refs) ? r.source_refs : []) as Ref[];
  const editable = !["diffuse", "archive"].includes(r.status);

  return (
    <>
      <PageHeader
        eyebrow={`NOAMIS INTELLIGENCE · ${REPORT_KINDS[r.kind]?.label}`}
        title={r.title}
        description={`Créé le ${formatDate(r.created_at)}${r.themes.length ? ` · ${r.themes.join(", ")}` : ""}`}
        actions={
          <>
            {r.ai_generated && <Badge tone="warning"><Bot className="size-3" /> Généré par IA</Badge>}
            {r.severity && <StatusBadge map={SEVERITY} value={r.severity} />}
            <StatusBadge map={REPORT_STATUS} value={r.status} />
            <Button asChild variant="outline"><a href={`/api/pdf/intelligence/${r.id}`}><FileDown /> PDF</a></Button>
          </>
        }
      />
      {r.ai_generated && r.status !== "valide" && r.status !== "diffuse" && (
        <div className="mb-6"><Notice tone="warning" title="Brouillon généré par IA">Ce contenu a été rédigé automatiquement : vérifiez chaque affirmation au regard des références avant validation. Il ne peut pas être diffusé sans validation humaine.</Notice></div>
      )}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader title="Contenu" description={editable ? "Toute modification d'un rapport validé le renvoie en brouillon." : "Rapport diffusé : contenu figé."} />
            <CardBody>
              {editable ? (
                <EntityForm schema="report" fields={reportFields} defaultValues={r} hidden={{ id: r.id }} action={saveReport} />
              ) : (
                <div className="space-y-3 text-sm">
                  {r.summary && <p className="font-medium">{r.summary}</p>}
                  <p className="whitespace-pre-wrap text-muted">{r.body}</p>
                </div>
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader
              title="Références"
              description="Chaque information doit pouvoir être rattachée à une source datée."
              action={editable && <FormDialog title="Ajouter une référence" size="lg" trigger={<Button size="sm"><Plus /> Référence</Button>} schema="reference" fields={referenceFields} defaultValues={{ date: todayISO(), reliability: "F", credibility: "6" }} action={addReference.bind(null, r.id)} />}
            />
            <CardBody className="p-0">
              {refs.length ? (
                <ol className="divide-y divide-border">
                  {refs.map((ref, i) => (
                    <li key={`${ref.url}-${i}`} className="flex items-start gap-3 px-5 py-3 text-sm">
                      <span className="w-6 shrink-0 text-muted">[{i + 1}]</span>
                      <div className="min-w-0 flex-1">
                        <a href={ref.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-start gap-1 hover:text-gold-text">{ref.title} <ExternalLink className="mt-0.5 size-3 shrink-0" /></a>
                        <p className="text-xs text-muted">{ref.source} · {formatDate(ref.date)} · fiabilité {ref.reliability} ({RELIABILITY[ref.reliability]?.label.split(" — ")[1]}) · {CREDIBILITY[ref.credibility]}</p>
                      </div>
                      {editable && (
                        <ActionButton variant="ghost" size="icon-sm" aria-label="Retirer la référence" action={removeReference.bind(null, r.id, i)}><Trash2 /></ActionButton>
                      )}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="p-5 text-sm text-warning">Aucune référence : la validation sera refusée.</p>
              )}
            </CardBody>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Validation" as="h3" />
            <CardBody className="space-y-3 text-sm">
              {r.validated_at ? (
                <p>Validé le {formatDateTime(r.validated_at)} par {(r.validator as { full_name: string | null } | null)?.full_name ?? "—"}.</p>
              ) : (
                <p className="text-muted">Non validé : diffusion impossible.</p>
              )}
              {r.status === "brouillon" && <ActionButton className="w-full" variant="secondary" action={submitForReview.bind(null, r.id)}><SendHorizontal /> Transmettre en revue</ActionButton>}
              {["brouillon", "en_revue"].includes(r.status) && (
                <ActionButton
                  className="w-full"
                  action={validateReport.bind(null, r.id)}
                  confirm={{ title: "Valider ce rapport ?", description: "Vous attestez avoir vérifié son contenu et ses références. Il pourra ensuite être diffusé aux clients autorisés.", confirmLabel: "Je valide" }}
                >
                  <BadgeCheck /> Valider
                </ActionButton>
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Diffusion aux clients" as="h3" />
            <CardBody className="space-y-3">
              {recipients?.length ? (
                <ul className="space-y-1 text-sm">
                  {recipients.map((x) => (
                    <li key={x.client_id} className="flex justify-between gap-2"><span>{(x.clients as { name: string } | null)?.name}</span><span className="text-xs text-muted">{formatDate(x.sent_at)}</span></li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">Pas encore diffusé.</p>
              )}
              {["valide", "diffuse"].includes(r.status) ? (
                <PublishForm reportId={r.id} clients={clients} already={(recipients ?? []).map((x) => x.client_id)} />
              ) : (
                <p className="text-xs text-muted">La diffusion est disponible après validation.</p>
              )}
            </CardBody>
          </Card>
          {r.status !== "archive" && (
            <ActionButton className="w-full" variant="ghost" action={archiveReport.bind(null, r.id)} redirectTo="/intelligence#rapports" confirm={{ title: "Archiver ce rapport ?", description: "Il restera consultable dans les archives.", confirmLabel: "Archiver" }}>
              <Archive /> Archiver
            </ActionButton>
          )}
          <Card><CardHeader title="Historique" as="h3" /><CardBody><HistoryTimeline session={session} entityType="intelligence_reports" entityId={r.id} /></CardBody></Card>
        </div>
      </div>
    </>
  );
}
