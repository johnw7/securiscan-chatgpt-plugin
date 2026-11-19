import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Archive, ClipboardCheck, FileText, Handshake, Lock, Pencil, Plus, Receipt, UserMinus } from "lucide-react";
import { HistoryTimeline } from "@/components/shared/history";
import { InternalNotes } from "@/components/shared/notes";
import { ActionButton, InlineSelect } from "@/components/ui/action-button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { FormDialog } from "@/components/ui/entity-form";
import { DefinitionList, EmptyState, Notice, PageHeader, Progress } from "@/components/ui/misc";
import { Tabs } from "@/components/ui/tabs";
import { addMissionMember, archiveMission, removeMissionMember, saveMission, saveTask, setMissionProgress, setMissionStatus } from "@/features/pilot/actions";
import { missionFields, taskFields } from "@/features/pilot/fields";
import { getClientOptions, getMissionOptions, getStaffOptions } from "@/features/pilot/queries";
import { TasksTable } from "@/features/pilot/tables";
import { requireCapability } from "@/lib/auth/session";
import { AUDIT_STATUS, DOC_CATEGORIES, MISSION_STATUS, PROJECT_PHASES, QUOTE_STATUS, SERVICE_TYPES, labelOf, optionsOf } from "@/lib/labels";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatEUR, todayISO } from "@/lib/utils";

export const metadata: Metadata = { title: "Mission" };

const PROGRESS_STEPS = Array.from({ length: 11 }, (_, i) => ({ value: String(i * 10), label: `${i * 10} %` }));

export default async function MissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireCapability("mission.manage");
  const { id } = await params;
  const supabase = await createClient();
  const { data: m } = await supabase
    .from("missions")
    .select("*, clients(id, name), manager:profiles!missions_manager_id_fkey(full_name)")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!m) notFound();

  const [tasks, members, docs, audits, projects, quotes, staff, clients, missionOptions] = await Promise.all([
    supabase.from("tasks").select("id, title, status, priority, due_date, assignee_id, profiles!tasks_assignee_id_fkey(full_name)").eq("mission_id", id).order("due_date", { nullsFirst: false }),
    supabase.from("mission_members").select("user_id, profiles(full_name, email)").eq("mission_id", id),
    supabase.from("documents").select("id, title, category, current_version, client_visible").eq("mission_id", id).is("deleted_at", null).order("updated_at", { ascending: false }),
    supabase.from("audits").select("id, reference, title, status").eq("mission_id", id).is("deleted_at", null),
    supabase.from("projects").select("id, reference, name, phase").eq("mission_id", id).is("deleted_at", null),
    supabase.from("quotes").select("id, number, title, status, total_ttc").eq("mission_id", id).is("deleted_at", null),
    getStaffOptions(),
    getClientOptions(),
    getMissionOptions(),
  ]);

  const client = m.clients as { id: string; name: string } | null;
  const today = todayISO();
  const taskRows = (tasks.data ?? []).map((t) => ({
    id: t.id, title: t.title, status: t.status, priority: t.priority, due_date: t.due_date, assignee_id: t.assignee_id,
    assignee: (t.profiles as { full_name: string | null } | null)?.full_name ?? null,
    mission: m.reference, mission_id: null, overdue: !!t.due_date && t.due_date < today && ["a_faire", "en_cours"].includes(t.status),
  }));
  const memberIds = new Set((members.data ?? []).map((x) => x.user_id));
  const canManageTeam = can(session.role, "admin.users") || m.manager_id === session.userId;

  return (
    <>
      <PageHeader
        eyebrow={`${m.reference} · ${labelOf(SERVICE_TYPES, m.service_type)}`}
        title={m.title}
        description={
          client ? (
            <>
              Client : <Link href={`/pilot/clients/${client.id}`} className="text-gold-text hover:underline">{client.name}</Link>
            </>
          ) : undefined
        }
        actions={
          <>
            {m.is_confidential && <Badge tone="warning"><Lock className="size-3" /> Confidentielle</Badge>}
            <InlineSelect label="Statut de la mission" value={m.status} options={optionsOf(MISSION_STATUS)} action={setMissionStatus.bind(null, m.id)} className="h-10 w-auto" />
            <FormDialog
              title="Modifier la mission"
              size="lg"
              trigger={<Button variant="secondary"><Pencil /> Modifier</Button>}
              schema="mission"
              fields={missionFields(clients, staff)}
              defaultValues={m}
              hidden={{ id: m.id }}
              action={saveMission}
            />
            {can(session.role, "mission.delete") && (
              <ActionButton
                variant="ghost"
                action={archiveMission.bind(null, m.id)}
                redirectTo="/pilot/missions"
                confirm={{ title: "Archiver cette mission ?", description: "Suppression logique : la mission et son historique sont conservés.", danger: true, confirmLabel: "Archiver" }}
              >
                <Archive /> Archiver
              </ActionButton>
            )}
          </>
        }
      />

      <Card className="mb-6">
        <CardBody className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="mb-2 text-sm text-muted">Avancement</p>
            <Progress value={m.progress} label="Avancement de la mission" />
          </div>
          <InlineSelect label="Modifier l'avancement" value={String(Math.round(m.progress / 10) * 10)} options={PROGRESS_STEPS} action={setMissionProgress.bind(null, m.id)} className="h-10 w-28" />
        </CardBody>
      </Card>

      <Tabs
        tabs={[
          {
            value: "synthese",
            label: "Synthèse",
            content: (
              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardHeader title="Fiche mission" />
                  <CardBody>
                    <DefinitionList
                      items={[
                        { label: "Identifiant", value: <span className="font-mono text-xs">{m.id}</span> },
                        { label: "Référence", value: m.reference },
                        { label: "Type de prestation", value: labelOf(SERVICE_TYPES, m.service_type) },
                        { label: "Responsable", value: (m.manager as { full_name: string | null } | null)?.full_name },
                        { label: "Début", value: formatDate(m.start_date) },
                        { label: "Fin prévue", value: formatDate(m.end_date) },
                        { label: "Budget", value: formatEUR(m.budget) },
                        { label: "Statut", value: <StatusBadge map={MISSION_STATUS} value={m.status} /> },
                        { label: "Portail client", value: m.client_visible ? "Visible par le client" : "Masquée" },
                      ]}
                    />
                    {m.description && <p className="mt-5 whitespace-pre-wrap border-t border-border pt-4 text-sm text-muted">{m.description}</p>}
                  </CardBody>
                </Card>
                <div className="space-y-6">
                  <Card>
                    <CardHeader title="Éléments liés" as="h3" />
                    <CardBody className="space-y-3 text-sm">
                      {(audits.data ?? []).map((a) => (
                        <Link key={a.id} href={`/audit/${a.id}`} className="flex items-center gap-2 hover:text-gold-text">
                          <ClipboardCheck className="size-4 text-gold-text" /> <span className="flex-1 truncate">{a.reference} — {a.title}</span>
                          <StatusBadge map={AUDIT_STATUS} value={a.status} />
                        </Link>
                      ))}
                      {(projects.data ?? []).map((p) => (
                        <Link key={p.id} href={`/project/${p.id}`} className="flex items-center gap-2 hover:text-gold-text">
                          <Handshake className="size-4 text-gold-text" /> <span className="flex-1 truncate">{p.reference} — {p.name}</span>
                          <Badge>{labelOf(PROJECT_PHASES, p.phase)}</Badge>
                        </Link>
                      ))}
                      {(quotes.data ?? []).map((q) => (
                        <Link key={q.id} href={`/finance/quotes/${q.id}`} className="flex items-center gap-2 hover:text-gold-text">
                          <Receipt className="size-4 text-gold-text" /> <span className="flex-1 truncate">{q.number}</span>
                          <StatusBadge map={QUOTE_STATUS} value={q.status} />
                        </Link>
                      ))}
                      {!audits.data?.length && !projects.data?.length && !quotes.data?.length && <p className="text-muted">Aucun audit, projet ou devis lié.</p>}
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button asChild size="sm" variant="secondary"><Link href={`/audit?new=1&mission=${m.id}`}>+ Audit</Link></Button>
                        <Button asChild size="sm" variant="secondary"><Link href={`/project?new=1&mission=${m.id}`}>+ Projet</Link></Button>
                        <Button asChild size="sm" variant="secondary"><Link href={`/finance/quotes/new?client=${m.client_id}&mission=${m.id}`}>+ Devis</Link></Button>
                      </div>
                    </CardBody>
                  </Card>
                  <Card>
                    <CardHeader title="Équipe" as="h3" description={m.is_confidential ? "Seuls ces membres (et les administrateurs) accèdent à la mission." : undefined} />
                    <CardBody className="space-y-3">
                      <ul className="space-y-2 text-sm">
                        {(members.data ?? []).map((x) => {
                          const p = x.profiles as { full_name: string | null; email: string } | null;
                          return (
                            <li key={x.user_id} className="flex items-center gap-2">
                              <span className="flex-1 truncate">{p?.full_name || p?.email}</span>
                              {canManageTeam && (
                                <ActionButton variant="ghost" size="icon-sm" aria-label="Retirer de l'équipe" action={removeMissionMember.bind(null, m.id, x.user_id)}>
                                  <UserMinus />
                                </ActionButton>
                              )}
                            </li>
                          );
                        })}
                        {!members.data?.length && <li className="text-muted">Aucun membre désigné.</li>}
                      </ul>
                      {canManageTeam && (
                        <FormDialog
                          title="Ajouter un membre"
                          size="sm"
                          trigger={<Button size="sm" variant="secondary"><Plus /> Ajouter</Button>}
                          schema="member"
                          fields={[{ name: "user_id", label: "Collaborateur", type: "select", options: staff.filter((s) => !memberIds.has(s.value)), required: true }]}
                          action={addMissionMember.bind(null, m.id)}
                          columns={1}
                        />
                      )}
                    </CardBody>
                  </Card>
                </div>
              </div>
            ),
          },
          {
            value: "taches",
            label: "Tâches",
            count: taskRows.length,
            content: (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <FormDialog
                    title="Nouvelle tâche"
                    trigger={<Button size="sm"><Plus /> Nouvelle tâche</Button>}
                    schema="task"
                    fields={taskFields(staff, missionOptions)}
                    defaultValues={{ mission_id: m.id, priority: "normale", status: "a_faire", assignee_id: session.userId }}
                    action={saveTask}
                    successMessage="Tâche créée"
                  />
                </div>
                <TasksTable rows={taskRows} me={session.userId} />
              </div>
            ),
          },
          {
            value: "documents",
            label: "Documents",
            count: docs.data?.length ?? 0,
            content: (
              <Card>
                <CardHeader title="Documents de la mission" action={<Button asChild size="sm"><Link href={`/docs?mission=${m.id}&client=${m.client_id}&upload=1`}><Plus /> Importer</Link></Button>} />
                <CardBody className="p-0">
                  {docs.data?.length ? (
                    <ul className="divide-y divide-border">
                      {docs.data.map((d) => (
                        <li key={d.id} className="flex items-center gap-3 px-5 py-3">
                          <FileText className="size-4 text-gold-text" aria-hidden />
                          <Link href={`/docs/${d.id}`} className="flex-1 truncate text-sm hover:text-gold-text">{d.title}</Link>
                          <StatusBadge map={DOC_CATEGORIES} value={d.category} />
                          <span className="text-xs text-muted">v{d.current_version}</span>
                        </li>
                      ))}
                    </ul>
                  ) : <div className="p-5"><EmptyState title="Aucun document" /></div>}
                </CardBody>
              </Card>
            ),
          },
          { value: "notes", label: "Notes internes", content: <InternalNotes scope={{ mission_id: m.id }} /> },
          {
            value: "historique",
            label: "Historique",
            content: (
              <Card>
                <CardBody className="space-y-4">
                  <Notice tone="gold">Les modifications sont journalisées automatiquement (auteur, date, valeurs avant/après).</Notice>
                  <HistoryTimeline session={session} entityType="missions" entityId={m.id} />
                </CardBody>
              </Card>
            ),
          },
        ]}
      />
    </>
  );
}
