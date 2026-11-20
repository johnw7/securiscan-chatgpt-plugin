import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Briefcase, CalendarClock, ClipboardCheck, Euro, KanbanSquare, Receipt, TrendingUp } from "lucide-react";
import { DonutChart, MonthlyBarChart } from "@/components/charts/charts";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState, PageHeader, StatCard } from "@/components/ui/misc";
import { amountDue, isOverdue, sum } from "@/features/finance/calc";
import { requireStaff } from "@/lib/auth/session";
import { EVENT_KINDS, LEAD_STAGES, LEAD_STAGE_ORDER, TASK_PRIORITY } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDateTime, formatEUR, isoInDays, todayISO } from "@/lib/utils";

export const metadata: Metadata = { title: "Tableau de bord" };

const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

export default async function DashboardPage() {
  const session = await requireStaff();
  const supabase = await createClient();
  const today = todayISO();
  const year = today.slice(0, 4);
  const in14 = isoInDays(14);

  const [missions, leads, invoices, tasks, audits, events] = await Promise.all([
    supabase.from("missions").select("id, status").is("deleted_at", null),
    supabase.from("leads").select("id, stage, estimated_amount, probability").is("deleted_at", null),
    supabase
      .from("invoices")
      .select("id, kind, status, total_ht, total_ttc, amount_paid, amount_credited, due_date, issue_date")
      .neq("status", "brouillon")
      .is("deleted_at", null),
    supabase
      .from("tasks")
      .select("id, title, due_date, priority, assignee_id, mission_id, missions(reference)")
      .in("status", ["a_faire", "en_cours"])
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(200),
    supabase.from("audits").select("id, status").is("deleted_at", null).in("status", ["brouillon", "en_cours", "en_revue"]),
    supabase
      .from("calendar_events")
      .select("id, title, starts_at, kind, location")
      .gte("starts_at", new Date().toISOString())
      .lte("starts_at", in14)
      .order("starts_at")
      .limit(6),
  ]);

  const activeMissions = (missions.data ?? []).filter((m) => ["planifiee", "en_cours", "en_pause"].includes(m.status)).length;
  const openLeads = (leads.data ?? []).filter((l) => !["gagne", "perdu"].includes(l.stage));
  const weightedPipeline = sum(openLeads.map((l) => (Number(l.estimated_amount ?? 0) * (l.probability ?? 0)) / 100));

  const issued = invoices.data ?? [];
  const thisYear = issued.filter((i) => i.issue_date?.startsWith(year));
  const revenueHt = sum(thisYear.map((i) => i.total_ht));
  const open = issued.filter((i) => i.kind === "facture" && ["emise", "partiellement_payee"].includes(i.status));
  const receivables = sum(open.map((i) => amountDue(i)));
  const overdue = open.filter((i) => isOverdue(i, today));

  const monthly = MONTHS.map((month, idx) => ({
    month,
    value: sum(thisYear.filter((i) => Number(i.issue_date!.slice(5, 7)) === idx + 1).map((i) => i.total_ht)),
  }));
  const pipelineByStage = LEAD_STAGE_ORDER.map((stage) => ({
    name: LEAD_STAGES[stage]!.label,
    value: (leads.data ?? []).filter((l) => l.stage === stage).length,
  })).filter((d) => d.value > 0);

  const allTasks = tasks.data ?? [];
  const overdueTasks = allTasks.filter((t) => t.due_date && t.due_date < today);
  const myTasks = allTasks.filter((t) => t.assignee_id === session.userId).slice(0, 6);

  return (
    <>
      <PageHeader
        eyebrow="NOAMIS PILOT"
        title={`Bonjour ${session.fullName.split(" ")[0]}`}
        description="Vue d'ensemble de l'activité : missions, pipeline commercial, facturation et échéances."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Missions actives" value={activeMissions} icon={Briefcase} hint={`${audits.data?.length ?? 0} audit(s) en cours`} />
        <StatCard label="Pipeline pondéré" value={formatEUR(weightedPipeline)} icon={KanbanSquare} tone="info" hint={`${openLeads.length} opportunité(s) ouverte(s)`} />
        <StatCard label={`Facturé HT ${year}`} value={formatEUR(revenueHt)} icon={TrendingUp} tone="success" hint="Factures et avoirs émis" />
        <StatCard
          label="Encours clients"
          value={formatEUR(receivables)}
          icon={Euro}
          tone={overdue.length ? "danger" : "gold"}
          hint={overdue.length ? `${overdue.length} facture(s) en retard` : "Aucun retard"}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Chiffre d'affaires facturé" description={`Montants HT par mois, ${year}`} />
          <CardBody>
            <MonthlyBarChart data={monthly} label="CA HT" />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Pipeline commercial" description="Opportunités par étape" action={<Link className="text-sm text-gold-text hover:underline" href="/pilot/leads">Ouvrir</Link>} />
          <CardBody>
            {pipelineByStage.length ? <DonutChart data={pipelineByStage} label="Répartition des opportunités" /> : <EmptyState title="Aucune opportunité" />}
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader
            title="Mes tâches"
            description={overdueTasks.length ? `${overdueTasks.length} tâche(s) en retard dans l'équipe` : "Aucun retard dans l'équipe"}
            action={<Link className="text-sm text-gold-text hover:underline" href="/pilot/tasks">Toutes</Link>}
          />
          <CardBody className="p-0">
            {myTasks.length ? (
              <ul className="divide-y divide-border">
                {myTasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                    {t.due_date && t.due_date < today ? <AlertTriangle className="size-4 shrink-0 text-danger" aria-label="En retard" /> : <ClipboardCheck className="size-4 shrink-0 text-muted" aria-hidden />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{t.title}</p>
                      <p className="text-xs text-muted">
                        {(t.missions as { reference: string } | null)?.reference ?? "Interne"} · {formatDate(t.due_date)}
                      </p>
                    </div>
                    <StatusBadge map={TASK_PRIORITY} value={t.priority} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-5">
                <EmptyState title="Aucune tâche assignée" />
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Agenda (14 jours)" action={<Link className="text-sm text-gold-text hover:underline" href="/pilot/calendar">Calendrier</Link>} />
          <CardBody className="p-0">
            {events.data?.length ? (
              <ul className="divide-y divide-border">
                {events.data.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 px-5 py-3">
                    <CalendarClock className="size-4 shrink-0 text-gold-text" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{e.title}</p>
                      <p className="text-xs text-muted">
                        {formatDateTime(e.starts_at)}
                        {e.location ? ` · ${e.location}` : ""}
                      </p>
                    </div>
                    <StatusBadge map={EVENT_KINDS} value={e.kind} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-5">
                <EmptyState title="Aucun rendez-vous à venir" />
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Factures en retard" action={<Link className="text-sm text-gold-text hover:underline" href="/finance/invoices">Factures</Link>} />
          <CardBody className="p-0">
            {overdue.length ? (
              <ul className="divide-y divide-border">
                {overdue.slice(0, 6).map((i) => (
                  <li key={i.id} className="flex items-center gap-3 px-5 py-3">
                    <Receipt className="size-4 shrink-0 text-danger" aria-hidden />
                    <Link href={`/finance/invoices/${i.id}`} className="flex-1 text-sm hover:underline">
                      Échéance {formatDate(i.due_date)}
                    </Link>
                    <span className="text-sm tabular-nums">{formatEUR(amountDue(i))}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-5">
                <EmptyState title="Aucune facture en retard" />
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
