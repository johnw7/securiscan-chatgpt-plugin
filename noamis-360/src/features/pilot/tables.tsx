"use client";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Progress } from "@/components/ui/misc";
import { CLIENT_CATEGORIES, CLIENT_STATUS, MISSION_STATUS, optionsOf, SERVICE_TYPES, TASK_PRIORITY, TASK_STATUS, labelOf } from "@/lib/labels";
import { formatDate, formatEUR } from "@/lib/utils";
import { Lock } from "lucide-react";
import { InlineSelect } from "@/components/ui/action-button";
import { setTaskStatus } from "./actions";

export type ClientRow = { id: string; name: string; category: string; status: string; city: string | null; email: string | null; missions: number; owner: string | null };

export function ClientsTable({ rows }: { rows: ClientRow[] }) {
  return (
    <DataTable
      caption="Liste des clients"
      rows={rows}
      searchText={(r) => `${r.name} ${r.city ?? ""} ${r.email ?? ""}`}
      searchPlaceholder="Rechercher un client…"
      onRowHref={(r) => `/pilot/clients/${r.id}`}
      emptyTitle="Aucun client"
      emptyDescription="Créez votre première fiche client."
      filters={[
        { key: "category", label: "Catégorie", options: optionsOf(CLIENT_CATEGORIES), predicate: (r, v) => r.category === v },
        { key: "status", label: "Statut", options: optionsOf(CLIENT_STATUS), predicate: (r, v) => r.status === v },
      ]}
      columns={[
        { key: "name", header: "Client", sortValue: (r) => r.name.toLowerCase(), cell: (r) => <Link href={`/pilot/clients/${r.id}`} className="font-medium hover:text-gold-text">{r.name}</Link> },
        { key: "category", header: "Catégorie", cell: (r) => labelOf(CLIENT_CATEGORIES, r.category), hideOnMobile: true },
        { key: "city", header: "Ville", cell: (r) => r.city ?? "—", sortValue: (r) => r.city, hideOnMobile: true },
        { key: "missions", header: "Missions", cell: (r) => r.missions, sortValue: (r) => r.missions, className: "text-right tabular-nums" },
        { key: "owner", header: "Responsable", cell: (r) => r.owner ?? "—", hideOnMobile: true },
        { key: "status", header: "Statut", cell: (r) => <StatusBadge map={CLIENT_STATUS} value={r.status} /> },
      ]}
    />
  );
}

export type MissionRow = {
  id: string; reference: string; title: string; client: string; service_type: string; status: string; progress: number;
  end_date: string | null; budget: string | null; manager: string | null; is_confidential: boolean;
};

export function MissionsTable({ rows, hideClient }: { rows: MissionRow[]; hideClient?: boolean }) {
  return (
    <DataTable
      caption="Liste des missions"
      rows={rows}
      searchText={(r) => `${r.reference} ${r.title} ${r.client}`}
      searchPlaceholder="Rechercher une mission…"
      onRowHref={(r) => `/pilot/missions/${r.id}`}
      emptyTitle="Aucune mission"
      filters={[
        { key: "status", label: "Statut", options: optionsOf(MISSION_STATUS), predicate: (r, v) => r.status === v },
        { key: "type", label: "Prestation", options: optionsOf(SERVICE_TYPES), predicate: (r, v) => r.service_type === v },
      ]}
      columns={[
        { key: "reference", header: "Réf.", sortValue: (r) => r.reference, cell: (r) => <span className="font-mono text-xs text-gold-text">{r.reference}</span> },
        {
          key: "title", header: "Mission", sortValue: (r) => r.title.toLowerCase(),
          cell: (r) => (
            <Link href={`/pilot/missions/${r.id}`} className="inline-flex items-center gap-1.5 font-medium hover:text-gold-text">
              {r.is_confidential && <Lock className="size-3.5 text-warning" aria-label="Confidentielle" />}
              {r.title}
            </Link>
          ),
        },
        ...(hideClient ? [] : [{ key: "client", header: "Client", cell: (r: MissionRow) => r.client, sortValue: (r: MissionRow) => r.client, hideOnMobile: true }]),
        { key: "type", header: "Prestation", cell: (r) => labelOf(SERVICE_TYPES, r.service_type), hideOnMobile: true },
        { key: "progress", header: "Avancement", cell: (r) => <div className="w-32"><Progress value={r.progress} /></div>, sortValue: (r) => r.progress, hideOnMobile: true },
        { key: "end", header: "Échéance", cell: (r) => formatDate(r.end_date), sortValue: (r) => r.end_date, hideOnMobile: true },
        { key: "budget", header: "Budget", cell: (r) => formatEUR(r.budget), sortValue: (r) => Number(r.budget ?? 0), className: "text-right tabular-nums", hideOnMobile: true },
        { key: "status", header: "Statut", cell: (r) => <StatusBadge map={MISSION_STATUS} value={r.status} /> },
      ]}
    />
  );
}

export type TaskRow = {
  id: string; title: string; status: string; priority: string; due_date: string | null; assignee: string | null;
  assignee_id: string | null; mission: string | null; mission_id: string | null; overdue: boolean;
};

export function TasksTable({ rows, me }: { rows: TaskRow[]; me: string }) {
  return (
    <DataTable
      caption="Liste des tâches"
      rows={rows}
      searchText={(r) => `${r.title} ${r.mission ?? ""} ${r.assignee ?? ""}`}
      searchPlaceholder="Rechercher une tâche…"
      emptyTitle="Aucune tâche"
      filters={[
        { key: "mine", label: "Assignation", options: [{ value: "me", label: "Mes tâches" }, { value: "none", label: "Non assignées" }], predicate: (r, v) => (v === "me" ? r.assignee_id === me : !r.assignee_id) },
        { key: "late", label: "Échéance", options: [{ value: "late", label: "En retard" }], predicate: (r) => r.overdue },
        { key: "status", label: "Statut", options: optionsOf(TASK_STATUS), predicate: (r, v) => r.status === v },
        { key: "priority", label: "Priorité", options: optionsOf(TASK_PRIORITY), predicate: (r, v) => r.priority === v },
      ]}
      columns={[
        { key: "title", header: "Tâche", sortValue: (r) => r.title.toLowerCase(), cell: (r) => <span className={r.overdue ? "text-danger" : ""}>{r.title}</span> },
        { key: "mission", header: "Mission", cell: (r) => (r.mission_id ? <Link className="hover:text-gold-text" href={`/pilot/missions/${r.mission_id}`}>{r.mission}</Link> : <span className="text-muted">Interne</span>), hideOnMobile: true },
        { key: "assignee", header: "Assignée à", cell: (r) => r.assignee ?? "—", hideOnMobile: true },
        { key: "due", header: "Échéance", cell: (r) => <span className={r.overdue ? "font-medium text-danger" : ""}>{formatDate(r.due_date)}</span>, sortValue: (r) => r.due_date },
        { key: "priority", header: "Priorité", cell: (r) => <StatusBadge map={TASK_PRIORITY} value={r.priority} />, hideOnMobile: true },
        { key: "status", header: "Statut", cell: (r) => <InlineSelect label={`Statut de ${r.title}`} value={r.status} options={optionsOf(TASK_STATUS)} action={(v) => setTaskStatus(r.id, v)} /> },
      ]}
    />
  );
}
