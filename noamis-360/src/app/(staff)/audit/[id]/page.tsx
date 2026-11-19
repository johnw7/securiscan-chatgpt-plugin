import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, BadgeCheck, FileDown, Pencil, Plus, Send, ShieldAlert, Trash2 } from "lucide-react";
import { ActionButton, InlineSelect } from "@/components/ui/action-button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EntityForm, FormDialog } from "@/components/ui/entity-form";
import { DefinitionList, EmptyState, Notice, PageHeader } from "@/components/ui/misc";
import { Tabs } from "@/components/ui/tabs";
import { HistoryTimeline } from "@/components/shared/history";
import {
  archiveAudit, deleteObservation, deleteRecommendation, deleteRisk, saveAudit, saveAuditReport, saveObservation, saveRecommendation, saveRisk,
  setRecommendationStatus, validateAudit,
} from "@/features/audit/actions";
import { publishAuditReport } from "@/features/audit/report-actions";
import { DEFAULT_CATEGORIES } from "@/features/audit/default-template";
import { auditFields, observationFields, recommendationFields, riskFields } from "@/features/audit/fields";
import { ObservationPhotos } from "@/features/audit/photos";
import { Questionnaire } from "@/features/audit/questionnaire";
import { RiskMatrix } from "@/features/audit/risk-matrix";
import { conformityByCategory, parseScoring, riskLevel, type Answer, type Question } from "@/features/audit/scoring";
import { getClientOptions, getMissionOptions, getStaffOptions } from "@/features/pilot/queries";
import { requireCapability } from "@/lib/auth/session";
import { AUDIT_CATEGORIES, AUDIT_STATUS, RECO_HORIZON, RECO_PRIORITY, RECO_STATUS, labelOf, optionsOf } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { cn, formatDate, formatDateTime, formatEUR } from "@/lib/utils";

export const metadata: Metadata = { title: "Audit" };

const LEVEL_TONE = { success: "success", gold: "gold", warning: "warning", danger: "danger" } as const;

export default async function AuditWorkspace({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireCapability("audit.manage");
  const { id } = await params;
  const supabase = await createClient();
  const { data: audit } = await supabase
    .from("audits")
    .select("*, clients(id, name), missions(id, reference), audit_templates(id, name, questions, categories, scoring), validator:profiles!audits_validated_by_fkey(full_name)")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!audit) notFound();

  const [observations, risks, recos, templates, clients, missions, staff] = await Promise.all([
    supabase.from("audit_observations").select("*").eq("audit_id", id).order("position").order("created_at"),
    supabase.from("risk_assessments").select("*").eq("audit_id", id).order("score", { ascending: false }),
    supabase.from("recommendations").select("*").eq("audit_id", id).order("priority").order("created_at"),
    supabase.from("audit_templates").select("id, name").eq("is_active", true),
    getClientOptions(),
    getMissionOptions(),
    getStaffOptions(),
  ]);

  const tpl = audit.audit_templates as { name: string; questions: unknown; categories: unknown; scoring: unknown } | null;
  const method = parseScoring(audit.scoring_snapshot ?? tpl?.scoring);
  const questions = (Array.isArray(tpl?.questions) ? tpl.questions : []) as Question[];
  const tplCategories = (Array.isArray(tpl?.categories) ? tpl.categories : []) as Array<{ key: string; label: string }>;
  const categories = (tplCategories.length ? tplCategories : DEFAULT_CATEGORIES).map((c) => ({ key: c.key, label: AUDIT_CATEGORIES[c.key]?.label ?? c.label }));
  const categoryOptions = categories.map((c) => ({ value: c.key, label: c.label }));
  const answers = (audit.answers ?? {}) as Record<string, Answer>;
  const validated = audit.status === "valide";
  const readOnly = validated || audit.status === "archive";
  const obsRows = observations.data ?? [];
  const riskRows = risks.data ?? [];
  const recoRows = recos.data ?? [];
  const client = audit.clients as { id: string; name: string } | null;
  const mission = audit.missions as { id: string; reference: string } | null;
  const conformity = conformityByCategory(questions, answers);

  return (
    <>
      <PageHeader
        eyebrow={`NOAMIS AUDIT · ${audit.reference}`}
        title={audit.title}
        description={
          <>
            {client && <Link className="text-gold-text hover:underline" href={`/pilot/clients/${client.id}`}>{client.name}</Link>}
            {mission && <> · <Link className="hover:underline" href={`/pilot/missions/${mission.id}`}>{mission.reference}</Link></>}
            {audit.site_name && <> · {audit.site_name}</>} · visite du {formatDate(audit.audit_date)}
          </>
        }
        actions={
          <>
            <StatusBadge map={AUDIT_STATUS} value={audit.status} />
            {!readOnly && (
              <FormDialog
                title="Modifier l'audit"
                size="lg"
                trigger={<Button variant="secondary"><Pencil /> Modifier</Button>}
                schema="audit"
                fields={auditFields(clients, missions, staff, (templates.data ?? []).map((t) => ({ value: t.id, label: t.name })))}
                defaultValues={audit}
                hidden={{ id: audit.id }}
                action={saveAudit}
              />
            )}
            <Button asChild variant="outline"><a href={`/api/pdf/audit/${audit.id}`}><FileDown /> Rapport PDF</a></Button>
          </>
        }
      />

      {validated ? (
        <div className="mb-6"><Notice tone="gold" title="Audit validé">Validé par {(audit.validator as { full_name: string | null } | null)?.full_name ?? "un consultant"} le {formatDateTime(audit.validated_at)}. Les cotations ne sont plus indicatives ; le contenu est figé.</Notice></div>
      ) : (
        <div className="mb-6"><Notice tone="warning" title="Résultats indicatifs">Les scores et niveaux de risque calculés automatiquement restent indicatifs tant que l&apos;audit n&apos;a pas été validé par un consultant NOAMIS.</Notice></div>
      )}

      <Tabs
        tabs={[
          {
            value: "questionnaire",
            label: "Questionnaire",
            content: questions.length ? (
              <Questionnaire auditId={audit.id} questions={questions} categories={categories} initialAnswers={answers} initialVersion={audit.draft_version} readOnly={readOnly} />
            ) : (
              <EmptyState title="Aucun modèle de questionnaire associé" description="Associez un modèle actif à l'audit via « Modifier »." />
            ),
          },
          {
            value: "constats",
            label: "Constats & photos",
            count: obsRows.length,
            content: (
              <div className="space-y-4">
                {!readOnly && (
                  <div className="flex justify-end">
                    <FormDialog
                      title="Nouveau constat"
                      trigger={<Button size="sm"><Plus /> Nouveau constat</Button>}
                      schema="observation"
                      fields={observationFields(categoryOptions)}
                      defaultValues={{ category: categoryOptions[0]?.value }}
                      action={saveObservation.bind(null, audit.id)}
                      successMessage="Constat ajouté"
                    />
                  </div>
                )}
                {obsRows.length ? (
                  obsRows.map((o) => (
                    <Card key={o.id}>
                      <CardHeader
                        as="h3"
                        title={<span className="flex items-center gap-2">{o.is_vulnerability && <ShieldAlert className="size-4 text-danger" aria-label="Vulnérabilité" />}{o.title}</span>}
                        description={`${labelOf(AUDIT_CATEGORIES, o.category)}${o.location ? ` · ${o.location}` : ""}`}
                        action={
                          !readOnly && (
                            <>
                              <FormDialog title="Modifier le constat" trigger={<Button variant="ghost" size="icon-sm" aria-label="Modifier le constat"><Pencil /></Button>} schema="observation" fields={observationFields(categoryOptions)} defaultValues={o} hidden={{ id: o.id }} action={saveObservation.bind(null, audit.id)} />
                              <ActionButton variant="ghost" size="icon-sm" aria-label="Supprimer le constat" action={deleteObservation.bind(null, audit.id, o.id)} confirm={{ title: "Supprimer ce constat ?", description: o.title, danger: true, confirmLabel: "Supprimer" }}><Trash2 /></ActionButton>
                            </>
                          )
                        }
                      />
                      <CardBody className="space-y-3">
                        {o.description && <p className="whitespace-pre-wrap text-sm text-muted">{o.description}</p>}
                        <ObservationPhotos auditId={audit.id} observationId={o.id} paths={o.photo_paths} readOnly={readOnly} />
                      </CardBody>
                    </Card>
                  ))
                ) : (
                  <EmptyState title="Aucun constat" description="Ajoutez les constats de la visite, avec photographies prises sur place." />
                )}
              </div>
            ),
          },
          {
            value: "risques",
            label: "Évaluation des risques",
            count: riskRows.length,
            content: (
              <div className="grid gap-6 xl:grid-cols-5">
                <Card className="xl:col-span-2">
                  <CardHeader title="Matrice des risques" description={method.name} />
                  <CardBody><RiskMatrix method={method} risks={riskRows} /></CardBody>
                </Card>
                <div className="space-y-4 xl:col-span-3">
                  {!readOnly && (
                    <div className="flex justify-end">
                      <FormDialog
                        title="Coter un risque"
                        description="Le score (vraisemblance × gravité) et le niveau sont calculés selon la méthode du modèle, à titre indicatif."
                        size="lg"
                        trigger={<Button size="sm"><Plus /> Coter un risque</Button>}
                        schema="risk"
                        fields={riskFields(method, categoryOptions, obsRows.map((o) => ({ value: o.id, label: o.title })))}
                        defaultValues={{ category: categoryOptions[0]?.value, likelihood: String(method.likelihood.min), impact: String(method.impact.min) }}
                        action={saveRisk.bind(null, audit.id)}
                      />
                    </div>
                  )}
                  {riskRows.length ? (
                    riskRows.map((r) => {
                      const lv = riskLevel(method, r.score ?? r.likelihood * r.impact);
                      const crit = (r.criteria ?? {}) as Record<string, string | null>;
                      return (
                        <Card key={r.id}>
                          <CardBody className="space-y-3">
                            <div className="flex flex-wrap items-start gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium">{r.threat}</p>
                                <p className="text-xs text-muted">{labelOf(AUDIT_CATEGORIES, r.category)}{r.vulnerability ? ` · ${r.vulnerability}` : ""}</p>
                              </div>
                              <Badge tone={LEVEL_TONE[lv.tone]}>{r.level} · {r.score}</Badge>
                              {!r.is_validated && <Badge tone="warning">Indicatif</Badge>}
                              {!readOnly && (
                                <>
                                  <FormDialog
                                    title="Modifier la cotation"
                                    size="lg"
                                    trigger={<Button variant="ghost" size="icon-sm" aria-label="Modifier la cotation"><Pencil /></Button>}
                                    schema="risk"
                                    fields={riskFields(method, categoryOptions, obsRows.map((o) => ({ value: o.id, label: o.title })))}
                                    defaultValues={{ ...r, ...Object.fromEntries(Object.entries(crit).map(([k, v]) => [`crit_${k}`, v])) }}
                                    hidden={{ id: r.id }}
                                    action={saveRisk.bind(null, audit.id)}
                                  />
                                  <ActionButton variant="ghost" size="icon-sm" aria-label="Supprimer la cotation" action={deleteRisk.bind(null, audit.id, r.id)} confirm={{ title: "Supprimer cette cotation ?", description: r.threat, danger: true, confirmLabel: "Supprimer" }}><Trash2 /></ActionButton>
                                </>
                              )}
                            </div>
                            <dl className="grid gap-2 text-sm sm:grid-cols-2">
                              <div><dt className="text-xs text-muted">Vraisemblance</dt><dd>{r.likelihood} — {method.likelihood.labels[r.likelihood - method.likelihood.min]}</dd></div>
                              <div><dt className="text-xs text-muted">Gravité</dt><dd>{r.impact} — {method.impact.labels[r.impact - method.impact.min]}</dd></div>
                              {method.criteria.filter((c) => crit[c.key]).map((c) => (
                                <div key={c.key} className="sm:col-span-2"><dt className="text-xs text-muted">{c.label}</dt><dd>{crit[c.key]}</dd></div>
                              ))}
                              <div className="sm:col-span-2"><dt className="text-xs text-muted">Justification</dt><dd className="whitespace-pre-wrap">{r.justification}</dd></div>
                            </dl>
                          </CardBody>
                        </Card>
                      );
                    })
                  ) : (
                    <EmptyState title="Aucun risque coté" description="Chaque cotation doit être justifiée ; au moins une est requise avant validation." />
                  )}
                </div>
              </div>
            ),
          },
          {
            value: "recommandations",
            label: "Recommandations",
            count: recoRows.length,
            content: (
              <Card>
                <CardHeader
                  title="Plan d'actions"
                  description="Priorisation P1 (urgent) à P4 (amélioration) et suivi des mesures correctives."
                  action={
                    <FormDialog
                      title="Nouvelle recommandation"
                      size="lg"
                      trigger={<Button size="sm"><Plus /> Recommandation</Button>}
                      schema="recommendation"
                      fields={recommendationFields(riskRows.map((r) => ({ value: r.id, label: `${r.threat} (${r.level})` })))}
                      defaultValues={{ priority: "P2", status: "proposee", client_visible: true }}
                      action={saveRecommendation.bind(null, audit.id)}
                    />
                  }
                />
                <CardBody className="p-0">
                  {recoRows.length ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <caption className="sr-only">Recommandations</caption>
                        <thead><tr className="border-b border-border text-left text-xs uppercase text-muted"><th className="px-4 py-3">Priorité</th><th className="px-4 py-3">Recommandation</th><th className="hidden px-4 py-3 md:table-cell">Horizon</th><th className="hidden px-4 py-3 md:table-cell">Coût estimé</th><th className="px-4 py-3">Suivi</th><th className="px-4 py-3"><span className="sr-only">Actions</span></th></tr></thead>
                        <tbody>
                          {recoRows.map((r) => (
                            <tr key={r.id} className="border-b border-border/60 last:border-0">
                              <td className="px-4 py-3"><StatusBadge map={RECO_PRIORITY} value={r.priority} /></td>
                              <td className="px-4 py-3"><p className="font-medium">{r.title}</p>{r.owner && <p className="text-xs text-muted">Porteur : {r.owner}</p>}</td>
                              <td className="hidden px-4 py-3 md:table-cell">{labelOf(RECO_HORIZON, r.horizon)}</td>
                              <td className="hidden px-4 py-3 tabular-nums md:table-cell">{formatEUR(r.estimated_cost)}</td>
                              <td className="px-4 py-3"><InlineSelect label={`Suivi de ${r.title}`} value={r.status} options={optionsOf(RECO_STATUS)} action={setRecommendationStatus.bind(null, audit.id, r.id)} /></td>
                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                <FormDialog title="Modifier la recommandation" size="lg" trigger={<Button variant="ghost" size="icon-sm" aria-label="Modifier"><Pencil /></Button>} schema="recommendation" fields={recommendationFields(riskRows.map((x) => ({ value: x.id, label: x.threat })))} defaultValues={r} hidden={{ id: r.id }} action={saveRecommendation.bind(null, audit.id)} />
                                <ActionButton variant="ghost" size="icon-sm" aria-label="Supprimer" action={deleteRecommendation.bind(null, audit.id, r.id)} confirm={{ title: "Supprimer cette recommandation ?", description: r.title, danger: true, confirmLabel: "Supprimer" }}><Trash2 /></ActionButton>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-5"><EmptyState title="Aucune recommandation" /></div>
                  )}
                </CardBody>
              </Card>
            ),
          },
          {
            value: "rapport",
            label: "Rapport & validation",
            content: (
              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardHeader title="Contenu du rapport" description="Méthodologie et synthèse reprises dans le rapport PDF." />
                  <CardBody>
                    {readOnly ? (
                      <div className="space-y-4 text-sm">
                        <div><h3 className="mb-1 font-semibold">Méthodologie</h3><p className="whitespace-pre-wrap text-muted">{audit.methodology ?? "—"}</p></div>
                        <div><h3 className="mb-1 font-semibold">Synthèse</h3><p className="whitespace-pre-wrap text-muted">{audit.summary ?? "—"}</p></div>
                      </div>
                    ) : (
                      <EntityForm
                        schema="auditReport"
                        columns={1}
                        fields={[
                          { name: "summary", label: "Synthèse et conclusions", type: "textarea", rows: 8 },
                          { name: "methodology", label: "Méthodologie", type: "textarea", rows: 8 },
                        ]}
                        defaultValues={audit}
                        action={saveAuditReport.bind(null, audit.id)}
                      />
                    )}
                  </CardBody>
                </Card>
                <div className="space-y-6">
                  <Card>
                    <CardHeader title="Conformité indicative" as="h3" />
                    <CardBody>
                      <ul className="space-y-2 text-sm">
                        {categories.map((c) => {
                          const s = conformity[c.key];
                          return (
                            <li key={c.key} className="flex items-center gap-2">
                              <span className="flex-1 truncate">{c.label}</span>
                              <span className={cn("tabular-nums", s?.rate === null || s?.rate === undefined ? "text-muted" : s.rate >= 75 ? "text-success" : s.rate >= 40 ? "text-warning" : "text-danger")}>
                                {s?.rate === null || s?.rate === undefined ? "—" : `${s.rate} %`}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </CardBody>
                  </Card>
                  <Card>
                    <CardHeader title="Validation et diffusion" as="h3" />
                    <CardBody className="space-y-3">
                      <DefinitionList items={[{ label: "Constats", value: obsRows.length }, { label: "Risques cotés", value: riskRows.length }, { label: "Recommandations", value: recoRows.length }]} />
                      {!readOnly && (
                        <ActionButton
                          className="w-full"
                          action={validateAudit.bind(null, audit.id)}
                          confirm={{
                            title: "Valider l'audit ?",
                            description: "En validant, vous confirmez en tant que consultant NOAMIS les constats et cotations. Le contenu sera figé et les résultats ne seront plus marqués comme indicatifs.",
                            confirmLabel: "Je valide",
                          }}
                        >
                          <BadgeCheck /> Valider l&apos;audit
                        </ActionButton>
                      )}
                      {validated && (
                        <ActionButton
                          className="w-full"
                          variant="outline"
                          action={publishAuditReport.bind(null, audit.id)}
                          confirm={{
                            title: "Déposer le rapport dans l'espace client ?",
                            description: "Le rapport PDF sera généré et déposé dans l'espace sécurisé du client (jamais partageable par lien public).",
                            confirmLabel: "Déposer",
                          }}
                        >
                          <Send /> Déposer dans l&apos;espace client
                        </ActionButton>
                      )}
                      {audit.status !== "archive" && validated && (
                        <ActionButton className="w-full" variant="ghost" action={archiveAudit.bind(null, audit.id)} redirectTo="/audit" confirm={{ title: "Archiver l'audit ?", description: "L'audit restera consultable en lecture seule.", confirmLabel: "Archiver" }}>
                          <Archive /> Archiver
                        </ActionButton>
                      )}
                    </CardBody>
                  </Card>
                </div>
              </div>
            ),
          },
          { value: "historique", label: "Historique", content: <Card><CardBody><HistoryTimeline session={session} entityType="audits" entityId={audit.id} /></CardBody></Card> },
        ]}
      />
    </>
  );
}
