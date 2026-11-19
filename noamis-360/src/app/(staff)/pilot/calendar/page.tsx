import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { FormDialog } from "@/components/ui/entity-form";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { deleteEvent, saveEvent } from "@/features/pilot/actions";
import { eventFields } from "@/features/pilot/fields";
import { getClientOptions, getMissionOptions } from "@/features/pilot/queries";
import { requireCapability } from "@/lib/auth/session";
import { EVENT_KINDS } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { cn, formatDateTime, isoToParisLocal, todayISO } from "@/lib/utils";

export const metadata: Metadata = { title: "Calendrier" };

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

type Item = { id: string; date: string; label: string; kind: "event" | "task" | "milestone"; href?: string };

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  await requireCapability("mission.manage");
  const { m } = await searchParams;
  const today = todayISO();
  const month = /^\d{4}-\d{2}$/.test(m ?? "") ? m! : today.slice(0, 7);
  const [y, mo] = month.split("-").map(Number) as [number, number];
  const first = new Date(Date.UTC(y, mo - 1, 1));
  const daysInMonth = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  const offset = (first.getUTCDay() + 6) % 7;
  const start = `${month}-01`;
  const end = `${month}-${String(daysInMonth).padStart(2, "0")}`;
  const prev = new Date(Date.UTC(y, mo - 2, 1)).toISOString().slice(0, 7);
  const next = new Date(Date.UTC(y, mo, 1)).toISOString().slice(0, 7);

  const supabase = await createClient();
  const [events, tasks, milestones, clients, missions] = await Promise.all([
    supabase.from("calendar_events").select("id, title, kind, starts_at, ends_at, location, client_id, mission_id, description").gte("starts_at", `${start}T00:00:00Z`).lte("starts_at", `${end}T23:59:59Z`).order("starts_at"),
    supabase.from("tasks").select("id, title, due_date, mission_id").gte("due_date", start).lte("due_date", end).in("status", ["a_faire", "en_cours"]),
    supabase.from("milestones").select("id, title, due_date, project_id").gte("due_date", start).lte("due_date", end),
    getClientOptions(),
    getMissionOptions(),
  ]);

  const items: Item[] = [
    ...(events.data ?? []).map((e) => ({ id: e.id, date: isoToParisLocal(e.starts_at).slice(0, 10), label: `${isoToParisLocal(e.starts_at).slice(11, 16)} ${e.title}`, kind: "event" as const })),
    ...(tasks.data ?? []).map((t) => ({ id: t.id, date: t.due_date!, label: t.title, kind: "task" as const, href: t.mission_id ? `/pilot/missions/${t.mission_id}#taches` : "/pilot/tasks" })),
    ...(milestones.data ?? []).map((ms) => ({ id: ms.id, date: ms.due_date!, label: ms.title, kind: "milestone" as const, href: `/project/${ms.project_id}#planning` })),
  ];
  const label = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" }).format(first);
  const dotClass = { event: "bg-gold", task: "bg-info", milestone: "bg-success" };

  return (
    <>
      <PageHeader
        eyebrow="NOAMIS PILOT"
        title="Calendrier"
        description="Rendez-vous, visites de site, échéances de tâches et jalons de projets."
        actions={
          <FormDialog
            title="Nouvel événement"
            size="lg"
            trigger={<Button><Plus /> Nouvel événement</Button>}
            schema="event"
            fields={eventFields(clients, missions)}
            defaultValues={{ kind: "rendez_vous", starts_at: `${today}T09:00`, ends_at: `${today}T10:00` }}
            action={saveEvent}
            successMessage="Événement créé"
          />
        }
      />
      <Card>
        <CardHeader
          title={<span className="capitalize">{label}</span>}
          action={
            <div className="flex items-center gap-1">
              <Button asChild variant="ghost" size="icon-sm"><Link href={`?m=${prev}`} aria-label="Mois précédent"><ChevronLeft /></Link></Button>
              <Button asChild variant="secondary" size="sm"><Link href="?">Aujourd&apos;hui</Link></Button>
              <Button asChild variant="ghost" size="icon-sm"><Link href={`?m=${next}`} aria-label="Mois suivant"><ChevronRight /></Link></Button>
            </div>
          }
        />
        <CardBody className="p-2 sm:p-4">
          <div className="mb-3 flex flex-wrap gap-4 px-2 text-xs text-muted">
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-gold" /> Événement</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-info" /> Échéance de tâche</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-success" /> Jalon de projet</span>
          </div>
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border text-xs">
            {WEEKDAYS.map((d) => (
              <div key={d} className="bg-surface-2 px-2 py-2 text-center font-medium text-muted">{d}</div>
            ))}
            {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} className="min-h-24 bg-surface/50" />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const date = `${month}-${String(i + 1).padStart(2, "0")}`;
              const dayItems = items.filter((it) => it.date === date);
              return (
                <div key={date} className={cn("min-h-24 bg-surface p-1.5", date === today && "ring-1 ring-inset ring-gold")}>
                  <p className={cn("mb-1 text-right text-[11px]", date === today ? "font-bold text-gold-text" : "text-muted")}>{i + 1}</p>
                  <ul className="space-y-1">
                    {dayItems.slice(0, 4).map((it) => (
                      <li key={`${it.kind}-${it.id}`} className="flex items-start gap-1 truncate" title={it.label}>
                        <span className={cn("mt-1 size-1.5 shrink-0 rounded-full", dotClass[it.kind])} aria-hidden />
                        {it.href ? <Link href={it.href} className="truncate hover:text-gold-text">{it.label}</Link> : <span className="truncate">{it.label}</span>}
                      </li>
                    ))}
                    {dayItems.length > 4 && <li className="text-muted">+{dayItems.length - 4}</li>}
                  </ul>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      <Card className="mt-6">
        <CardHeader title="Événements du mois" />
        <CardBody className="p-0">
          {events.data?.length ? (
            <ul className="divide-y divide-border">
              {events.data.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                  <span className="w-36 text-muted">{formatDateTime(e.starts_at)}</span>
                  <span className="flex-1">{e.title}{e.location ? <span className="text-muted"> · {e.location}</span> : null}</span>
                  <StatusBadge map={EVENT_KINDS} value={e.kind} />
                  <FormDialog
                    title="Modifier l'événement"
                    size="lg"
                    trigger={<Button variant="ghost" size="sm">Modifier</Button>}
                    schema="event"
                    fields={eventFields(clients, missions)}
                    defaultValues={{ ...e, starts_at: isoToParisLocal(e.starts_at), ends_at: isoToParisLocal(e.ends_at) }}
                    hidden={{ id: e.id }}
                    action={saveEvent}
                  />
                  <ActionButton variant="ghost" size="icon-sm" aria-label={`Supprimer ${e.title}`} action={deleteEvent.bind(null, e.id)} confirm={{ title: "Supprimer l'événement ?", description: e.title, danger: true, confirmLabel: "Supprimer" }}>
                    <Trash2 />
                  </ActionButton>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-5"><EmptyState title="Aucun événement ce mois-ci" /></div>
          )}
        </CardBody>
      </Card>
    </>
  );
}
