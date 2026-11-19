import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, FileDown, FileSpreadsheet, Pencil, Plus, Trash2 } from "lucide-react";
import { HistoryTimeline } from "@/components/shared/history";
import { ActionButton, InlineSelect } from "@/components/ui/action-button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EntityForm, FormDialog } from "@/components/ui/entity-form";
import { DefinitionList, EmptyState, Notice, PageHeader } from "@/components/ui/misc";
import { Tabs } from "@/components/ui/tabs";
import {
  closeProject, deleteCriterion, deleteMilestone, saveCriterion, saveDecision, saveMeeting, saveMilestone, saveOffer, saveProject, saveReception,
  saveSpecification, setDecisionStatus, setProjectPhase,
} from "@/features/project/actions";
import { criterionFields, decisionFields, meetingFields, milestoneFields, offerFields, projectFields } from "@/features/project/fields";
import { ScoreGrid } from "@/features/project/score-grid";
import { getClientOptions, getMissionOptions } from "@/features/pilot/queries";
import { requireCapability } from "@/lib/auth/session";
import { DECISION_KINDS, DECISION_STATUS, MILESTONE_STATUS, PROJECT_PHASES, PROJECT_PHASE_ORDER, PROJECT_STATUS, optionsOf } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { cn, formatDate, formatDateTime, formatEUR, isoToParisLocal, todayISO } from "@/lib/utils";

export const metadata: Metadata = { title: "Projet" };

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireCapability("project.manage");
  const { id } = await params;
  const supabase = await createClient();
  const { data: p } = await supabase.from("projects").select("*, clients(id, name), missions(id, reference)").eq("id", id).is("deleted_at", null).maybeSingle();
  if (!p) notFound();

  const [milestones, criteria, offers, meetings, decisions, vendors, clients, missions] = await Promise.all([
    supabase.from("milestones").select("*").eq("project_id", id).order("position").order("due_date"),
    supabase.from("selection_criteria").select("*").eq("project_id", id).order("position"),
    supabase.from("vendor_offers").select("*, vendors(name)").eq("project_id", id).order("amount_ht"),
    supabase.from("project_meetings").select("*").eq("project_id", id).order("held_at", { ascending: false }),
    supabase.from("project_decisions").select("*").eq("project_id", id).order("decided_at", { ascending: false }).order("created_at", { ascending: false }),
    supabase.from("vendors").select("id, name").is("deleted_at", null).order("name"),
    getClientOptions(),
    getMissionOptions(),
  ]);

  const closed = p.status === "clos";
  const client = p.clients as { id: string; name: string } | null;
  const phaseIndex = PROJECT_PHASE_ORDER.indexOf(p.phase);
  const today = todayISO();
  const offerRows = (offers.data ?? []).map((o) => ({
    id: o.id, vendor: (o.vendors as { name: string } | null)?.name ?? "—", amount_ht: Number(o.amount_ht), delay_weeks: o.delay_weeks,
    scores: (o.scores ?? {}) as Record<string, number>,
  }));
  const selected = (offers.data ?? []).find((o) => o.is_selected);
  const decisionRows = decisions.data ?? [];
  const openReserves = decisionRows.filter((d) => d.kind === "reserve" && !["levee", "close"].includes(d.status));
  const meetingOptions = (meetings.data ?? []).map((m) => ({ value: m.id, label: `${formatDate(m.held_at)} — ${m.title}` }));

  return (
    <>
      <PageHeader
        eyebrow={`NOAMIS PROJECT · ${p.reference}`}
        title={p.name}
        description={client ? <>Client : <Link href={`/pilot/clients/${client.id}`} className="text-gold-text hover:underline">{client.name}</Link> · Budget {formatEUR(p.budget)} · {formatDate(p.start_date)} → {formatDate(p.end_date)}</> : undefined}
        actions={
          <>
            <StatusBadge map={PROJECT_STATUS} value={p.status} />
            {!closed && (
              <FormDialog title="Modifier le projet" size="lg" trigger={<Button variant="secondary"><Pencil /> Modifier</Button>} schema="project" fields={projectFields(clients, missions)} defaultValues={p} hidden={{ id: p.id }} action={saveProject} />
            )}
          </>
        }
      />

      <Card className="mb-6">
        <CardBody>
          <ol className="grid gap-2 sm:grid-cols-3 lg:grid-cols-9" aria-label="Étapes de la méthode AMOA NOAMIS">
            {PROJECT_PHASE_ORDER.map((ph, i) => (
              <li key={ph} aria-current={ph === p.phase ? "step" : undefined} className={cn("rounded-lg border px-2 py-2 text-xs", i < phaseIndex ? "border-success/40 bg-success/10 text-success" : ph === p.phase ? "border-gold bg-gold/15 text-foreground" : "border-border text-muted")}>
                {i < phaseIndex && <CheckCircle2 className="mb-1 size-3.5" aria-hidden />}
                {PROJECT_PHASES[ph]?.label}
              </li>
            ))}
          </ol>
          {!closed && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-muted">Étape en cours :</span>
              <InlineSelect label="Étape du projet" value={p.phase} options={optionsOf(PROJECT_PHASES).filter((o) => o.value !== "cloture")} action={setProjectPhase.bind(null, p.id)} className="h-9 w-auto" />
            </div>
          )}
        </CardBody>
      </Card>

      <Tabs
        tabs={[
          {
            value: "cdc",
            label: "Cahier des charges",
            content: (
              <Card>
                <CardHeader title="Cahier des besoins fonctionnels" description="Expression du besoin, exigences et contraintes, base de la consultation." />
                <CardBody>
                  {closed ? <p className="whitespace-pre-wrap text-sm">{p.specification ?? "—"}</p> : (
                    <EntityForm schema="specification" columns={1} fields={[{ name: "specification", label: "Contenu", type: "textarea", rows: 18 }]} defaultValues={p} action={saveSpecification.bind(null, p.id)} />
                  )}
                </CardBody>
              </Card>
            ),
          },
          {
            value: "planning",
            label: "Planning & jalons",
            count: milestones.data?.length ?? 0,
            content: (
              <Card>
                <CardHeader title="Jalons" action={!closed && <FormDialog title="Nouveau jalon" trigger={<Button size="sm"><Plus /> Jalon</Button>} schema="milestone" fields={milestoneFields} defaultValues={{ status: "a_venir", position: milestones.data?.length ?? 0 }} action={saveMilestone.bind(null, p.id)} />} />
                <CardBody className="p-0">
                  {milestones.data?.length ? (
                    <ol className="divide-y divide-border">
                      {milestones.data.map((m) => {
                        const late = m.due_date && m.due_date < today && !["atteint", "annule"].includes(m.status);
                        return (
                          <li key={m.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                            <span className={cn("size-2.5 rounded-full", m.status === "atteint" ? "bg-success" : late ? "bg-danger" : "bg-gold")} aria-hidden />
                            <span className="flex-1 text-sm">{m.title}</span>
                            <span className={cn("text-sm", late && "text-danger")}>{formatDate(m.due_date)}</span>
                            <StatusBadge map={MILESTONE_STATUS} value={late ? "en_retard" : m.status} />
                            {!closed && (
                              <>
                                <FormDialog title="Modifier le jalon" trigger={<Button variant="ghost" size="icon-sm" aria-label="Modifier le jalon"><Pencil /></Button>} schema="milestone" fields={milestoneFields} defaultValues={m} hidden={{ id: m.id }} action={saveMilestone.bind(null, p.id)} />
                                <ActionButton variant="ghost" size="icon-sm" aria-label="Supprimer le jalon" action={deleteMilestone.bind(null, p.id, m.id)} confirm={{ title: "Supprimer ce jalon ?", description: m.title, danger: true, confirmLabel: "Supprimer" }}><Trash2 /></ActionButton>
                              </>
                            )}
                          </li>
                        );
                      })}
                    </ol>
                  ) : <div className="p-5"><EmptyState title="Aucun jalon" /></div>}
                </CardBody>
              </Card>
            ),
          },
          {
            value: "offres",
            label: "Offres & comparatif",
            count: offerRows.length,
            content: (
              <div className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader title="Critères de sélection pondérés" action={!closed && <FormDialog title="Nouveau critère" size="sm" trigger={<Button size="sm"><Plus /> Critère</Button>} schema="criterion" fields={criterionFields} defaultValues={{ position: criteria.data?.length ?? 0 }} action={saveCriterion.bind(null, p.id)} columns={1} />} />
                    <CardBody className="p-0">
                      {criteria.data?.length ? (
                        <ul className="divide-y divide-border">
                          {criteria.data.map((c) => (
                            <li key={c.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                              <span className="flex-1">{c.label}</span>
                              <Badge tone="gold">{Number(c.weight)} %</Badge>
                              {!closed && (
                                <>
                                  <FormDialog title="Modifier le critère" size="sm" trigger={<Button variant="ghost" size="icon-sm" aria-label="Modifier le critère"><Pencil /></Button>} schema="criterion" fields={criterionFields} defaultValues={c} hidden={{ id: c.id }} action={saveCriterion.bind(null, p.id)} columns={1} />
                                  <ActionButton variant="ghost" size="icon-sm" aria-label="Supprimer le critère" action={deleteCriterion.bind(null, p.id, c.id)} confirm={{ title: "Supprimer ce critère ?", description: c.label, danger: true, confirmLabel: "Supprimer" }}><Trash2 /></ActionButton>
                                </>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : <div className="p-5"><EmptyState title="Aucun critère" /></div>}
                    </CardBody>
                  </Card>
                  <Card>
                    <CardHeader
                      title="Offres reçues"
                      action={!closed && (
                        <>
                          <Button asChild size="sm" variant="ghost"><Link href="/project/vendors">Prestataires</Link></Button>
                          <FormDialog title="Nouvelle offre" size="lg" trigger={<Button size="sm"><Plus /> Offre</Button>} schema="offer" fields={offerFields((vendors.data ?? []).map((v) => ({ value: v.id, label: v.name })))} defaultValues={{ received_at: today }} action={saveOffer.bind(null, p.id)} />
                        </>
                      )}
                    />
                    <CardBody className="p-0">
                      {offers.data?.length ? (
                        <ul className="divide-y divide-border">
                          {offers.data.map((o) => (
                            <li key={o.id} className="px-5 py-3 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="flex-1 font-medium">{(o.vendors as { name: string } | null)?.name}</span>
                                {o.is_selected && <Badge tone="gold">Retenue</Badge>}
                                <span className="tabular-nums">{formatEUR(o.amount_ht)}</span>
                                {!closed && <FormDialog title="Modifier l'offre" size="lg" trigger={<Button variant="ghost" size="icon-sm" aria-label="Modifier l'offre"><Pencil /></Button>} schema="offer" fields={offerFields((vendors.data ?? []).map((v) => ({ value: v.id, label: v.name })))} defaultValues={o} hidden={{ id: o.id }} action={saveOffer.bind(null, p.id)} />}
                              </div>
                              {(o.strengths || o.weaknesses) && <p className="mt-1 text-xs text-muted">{o.strengths ? `+ ${o.strengths}` : ""} {o.weaknesses ? `· Vigilance : ${o.weaknesses}` : ""}</p>}
                            </li>
                          ))}
                        </ul>
                      ) : <div className="p-5"><EmptyState title="Aucune offre" /></div>}
                    </CardBody>
                  </Card>
                </div>
                <Card>
                  <CardHeader
                    title="Tableau comparatif"
                    description="Notes de 0 à 10 par critère ; la note pondérée et le classement se mettent à jour en direct."
                    action={
                      <>
                        <Button asChild size="sm" variant="outline"><a href={`/api/pdf/project/${p.id}`}><FileDown /> PDF</a></Button>
                        <Button asChild size="sm" variant="outline"><a href={`/api/xlsx/project/${p.id}`}><FileSpreadsheet /> Excel</a></Button>
                      </>
                    }
                  />
                  <CardBody>
                    <ScoreGrid projectId={p.id} criteria={(criteria.data ?? []).map((c) => ({ id: c.id, label: c.label, weight: Number(c.weight) }))} offers={offerRows} selectedId={selected?.id ?? null} readOnly={closed} />
                  </CardBody>
                </Card>
              </div>
            ),
          },
          {
            value: "reunions",
            label: "Réunions & CR",
            count: meetings.data?.length ?? 0,
            content: (
              <div className="space-y-4">
                {!closed && <div className="flex justify-end"><FormDialog title="Nouvelle réunion" size="lg" trigger={<Button size="sm"><Plus /> Réunion</Button>} schema="meeting" fields={meetingFields} defaultValues={{ held_at: `${today}T10:00`, client_visible: true }} action={saveMeeting.bind(null, p.id)} /></div>}
                {meetings.data?.length ? meetings.data.map((m) => (
                  <Card key={m.id}>
                    <CardHeader as="h3" title={m.title} description={`${formatDateTime(m.held_at)}${m.location ? ` · ${m.location}` : ""}${m.attendees ? ` · ${m.attendees}` : ""}`} action={<>{m.client_visible && <Badge tone="gold">Visible client</Badge>}{!closed && <FormDialog title="Modifier la réunion" size="lg" trigger={<Button variant="ghost" size="icon-sm" aria-label="Modifier la réunion"><Pencil /></Button>} schema="meeting" fields={meetingFields} defaultValues={{ ...m, held_at: isoToParisLocal(m.held_at) }} hidden={{ id: m.id }} action={saveMeeting.bind(null, p.id)} />}</>} />
                    {m.minutes && <CardBody><p className="whitespace-pre-wrap text-sm text-muted">{m.minutes}</p></CardBody>}
                  </Card>
                )) : <EmptyState title="Aucune réunion" />}
              </div>
            ),
          },
          {
            value: "decisions",
            label: "Décisions, actions & réserves",
            count: decisionRows.length,
            content: (
              <Card>
                <CardHeader title="Registre" description="Historique complet et non supprimable des décisions, actions correctives et réserves." action={!closed && <FormDialog title="Nouvelle entrée" size="lg" trigger={<Button size="sm"><Plus /> Ajouter</Button>} schema="decision" fields={decisionFields(meetingOptions)} defaultValues={{ kind: "decision", status: "ouverte", decided_at: today }} action={saveDecision.bind(null, p.id)} />} />
                <CardBody className="p-0">
                  {decisionRows.length ? (
                    <ul className="divide-y divide-border">
                      {decisionRows.map((d) => (
                        <li key={d.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                          <StatusBadge map={DECISION_KINDS} value={d.kind} />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium">{d.title}</p>
                            <p className="text-xs text-muted">{formatDate(d.decided_at)}{d.decided_by ? ` · ${d.decided_by}` : ""}{d.owner ? ` · Responsable : ${d.owner}` : ""}{d.due_date ? ` · Échéance ${formatDate(d.due_date)}` : ""}</p>
                          </div>
                          {closed ? <StatusBadge map={DECISION_STATUS} value={d.status} /> : <InlineSelect label={`Statut de ${d.title}`} value={d.status} options={optionsOf(DECISION_STATUS)} action={setDecisionStatus.bind(null, p.id, d.id)} />}
                        </li>
                      ))}
                    </ul>
                  ) : <div className="p-5"><EmptyState title="Registre vide" /></div>}
                </CardBody>
              </Card>
            ),
          },
          {
            value: "reception",
            label: "Réception & clôture",
            content: (
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader title="Assistance à la réception" />
                  <CardBody>
                    {openReserves.length > 0 && <div className="mb-4"><Notice tone="warning" title={`${openReserves.length} réserve(s) ouverte(s)`}>{openReserves.map((r) => r.title).join(" · ")}</Notice></div>}
                    {closed ? <DefinitionList items={[{ label: "Date de réception", value: formatDate(p.reception_date) }, { label: "Observations", value: p.reception_notes }]} /> : (
                      <EntityForm schema="reception" columns={1} fields={[{ name: "reception_date", label: "Date de réception", type: "date" }, { name: "reception_notes", label: "Observations de réception", type: "textarea", rows: 5 }]} defaultValues={p} action={saveReception.bind(null, p.id)} />
                    )}
                  </CardBody>
                </Card>
                <Card>
                  <CardHeader title="Clôture et transfert documentaire" />
                  <CardBody>
                    {closed ? (
                      <DefinitionList items={[{ label: "Clôturé le", value: formatDateTime(p.closed_at) }, { label: "Bilan", value: p.closure_notes }]} />
                    ) : (
                      <>
                        <p className="mb-4 text-sm text-muted">La clôture fige le projet. Elle est refusée tant qu&apos;une réserve reste ouverte.</p>
                        <EntityForm schema="closure" columns={1} fields={[{ name: "closure_notes", label: "Bilan de mission", type: "textarea", rows: 5, required: true }]} action={closeProject.bind(null, p.id)} submitLabel="Clôturer le projet" />
                      </>
                    )}
                  </CardBody>
                </Card>
              </div>
            ),
          },
          { value: "historique", label: "Historique", content: <Card><CardBody><HistoryTimeline session={session} entityType="projects" entityId={p.id} /></CardBody></Card> },
        ]}
      />
    </>
  );
}
