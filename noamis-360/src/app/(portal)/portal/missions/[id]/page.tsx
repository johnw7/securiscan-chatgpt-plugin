import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, Circle, FileText } from "lucide-react";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DefinitionList, EmptyState, PageHeader, Progress } from "@/components/ui/misc";
import { requireClient } from "@/lib/auth/session";
import { DECISION_KINDS, DECISION_STATUS, MILESTONE_STATUS, MISSION_STATUS, PROJECT_PHASES, SERVICE_TYPES, TASK_STATUS, labelOf } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Ma mission" };

export default async function PortalMission({ params }: { params: Promise<{ id: string }> }) {
  await requireClient();
  const { id } = await params;
  const supabase = await createClient();
  const { data: m } = await supabase.from("missions").select("id, reference, title, description, service_type, status, progress, start_date, end_date").eq("id", id).maybeSingle();
  if (!m) notFound();
  const [{ data: tasks }, { data: docs }, { data: projects }] = await Promise.all([
    supabase.from("tasks").select("id, title, due_date, status").eq("mission_id", id).order("due_date"),
    supabase.from("documents").select("id, title, category, updated_at, current_version").eq("mission_id", id).order("updated_at", { ascending: false }),
    supabase.from("projects").select("id, name, phase, milestones(id, title, due_date, status, position), project_meetings(id, title, held_at, minutes), project_decisions(id, kind, title, status, decided_at)").eq("mission_id", id),
  ]);
  return (
    <>
      <PageHeader eyebrow={`NOAMIS CONNECT · ${m.reference}`} title={m.title} description={labelOf(SERVICE_TYPES, m.service_type)} actions={<StatusBadge map={MISSION_STATUS} value={m.status} />} />
      <Card className="mb-6">
        <CardBody className="space-y-4">
          <Progress value={m.progress} label="Avancement de la mission" />
          <DefinitionList items={[{ label: "Début", value: formatDate(m.start_date) }, { label: "Fin prévue", value: formatDate(m.end_date) }]} />
          {m.description && <p className="whitespace-pre-wrap text-sm text-muted">{m.description}</p>}
        </CardBody>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Échéances" />
          <CardBody>
            {tasks?.length ? (
              <ul className="space-y-2 text-sm">
                {tasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-2">
                    {t.status === "terminee" ? <CheckCircle2 className="size-4 text-success" aria-hidden /> : <Circle className="size-4 text-muted" aria-hidden />}
                    <span className="flex-1">{t.title}</span>
                    <span className="text-muted">{formatDate(t.due_date)}</span>
                    <StatusBadge map={TASK_STATUS} value={t.status} />
                  </li>
                ))}
              </ul>
            ) : <EmptyState title="Aucune échéance partagée" />}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Documents de la mission" />
          <CardBody>
            {docs?.length ? (
              <ul className="space-y-2 text-sm">
                {docs.map((d) => (
                  <li key={d.id} className="flex items-center gap-2">
                    <FileText className="size-4 text-gold-text" aria-hidden />
                    <a href={`/api/documents/${d.id}/download`} className="flex-1 truncate hover:text-gold-text">{d.title}</a>
                    <span className="text-xs text-muted">v{d.current_version} · {formatDate(d.updated_at)}</span>
                  </li>
                ))}
              </ul>
            ) : <EmptyState title="Aucun document partagé" />}
          </CardBody>
        </Card>
      </div>
      {(projects ?? []).map((p) => (
        <Card key={p.id} className="mt-6">
          <CardHeader title={`Projet : ${p.name}`} description={labelOf(PROJECT_PHASES, p.phase)} />
          <CardBody className="grid gap-6 lg:grid-cols-3">
            <div>
              <h3 className="mb-2 text-sm font-semibold">Jalons</h3>
              <ul className="space-y-1 text-sm">{[...(p.milestones ?? [])].sort((a, b) => a.position - b.position).map((ms) => <li key={ms.id} className="flex justify-between gap-2"><span>{ms.title}</span><StatusBadge map={MILESTONE_STATUS} value={ms.status} /></li>)}</ul>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">Comptes rendus</h3>
              <ul className="space-y-2 text-sm">{(p.project_meetings ?? []).map((mt) => <li key={mt.id}><details><summary className="cursor-pointer">{mt.title} <span className="text-xs text-muted">({formatDateTime(mt.held_at)})</span></summary><p className="mt-1 whitespace-pre-wrap text-xs text-muted">{mt.minutes ?? "—"}</p></details></li>)}</ul>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">Décisions et réserves</h3>
              <ul className="space-y-1 text-sm">{(p.project_decisions ?? []).map((d) => <li key={d.id} className="flex flex-wrap items-center gap-1.5"><StatusBadge map={DECISION_KINDS} value={d.kind} /><span className="flex-1">{d.title}</span><Badge>{DECISION_STATUS[d.status]?.label}</Badge></li>)}</ul>
            </div>
          </CardBody>
        </Card>
      ))}
    </>
  );
}
