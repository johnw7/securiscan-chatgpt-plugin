"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarCheck, ChevronLeft, ChevronRight, Inbox, Plus } from "lucide-react";
import type { Intervention, ISODate } from "@/lib/types";
import { useStore } from "@/lib/store/AppStore";
import { byTime, getClient, getMember, memberName } from "@/lib/store/selectors";
import { addDays, addMinutesToTime, formatDate, formatMonth, formatWeekday, fromISODate, startOfMonth, startOfWeek, toISODate } from "@/lib/dates";
import { PageHeader } from "@/components/ui/PageHeader";
import { Segmented } from "@/components/ui/Segmented";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge, PriorityBadge } from "@/components/interventions/Badges";
import { InterventionForm } from "@/components/interventions/InterventionForm";
import { ScheduleModal } from "@/components/interventions/ScheduleModal";
import { cn } from "@/lib/utils";

type View = "day" | "week" | "month";

const VIEWS: { value: View; label: string }[] = [
  { value: "day", label: "Jour" },
  { value: "week", label: "Semaine" },
  { value: "month", label: "Mois" },
];

const STATUS_BAR: Record<Intervention["status"], string> = {
  A_PLANIFIER: "bg-amber-400",
  PLANIFIEE: "bg-electric",
  EN_COURS: "bg-cyan-brand",
  TERMINEE: "bg-emerald-500",
  ANNULEE: "bg-slate-300",
};

function PlanningCard({ intervention, compact }: { intervention: Intervention; compact?: boolean }) {
  const { data } = useStore();
  const client = getClient(data, intervention.clientId);
  const tech = getMember(data, intervention.technicianId);
  const done = intervention.status === "TERMINEE";
  return (
    <Link
      href={`/interventions/${intervention.id}`}
      className={cn(
        "group relative block animate-scale-in overflow-hidden rounded-xl border bg-white py-2.5 pr-2.5 pl-3.5 shadow-card transition duration-150 hover:-translate-y-0.5 hover:border-electric/30 hover:shadow-card-hover",
        intervention.status === "EN_COURS" ? "border-cyan-300 ring-2 ring-cyan-brand/20" : "border-line",
        done && "opacity-70",
      )}
    >
      <span className={cn("absolute inset-y-0 left-0 w-1", STATUS_BAR[intervention.status])} />
      <div className="flex items-center justify-between gap-2">
        <span className="tabular font-display text-[13px] font-bold text-navy">{intervention.time}</span>
        {intervention.priority === "URGENTE" && <span className="size-1.5 rounded-full bg-rose-500" title="Urgente" />}
      </div>
      <p className="mt-0.5 truncate text-[13px] font-semibold text-ink group-hover:text-electric">{client?.name}</p>
      {!compact && <p className="truncate text-[11.5px] text-muted">{intervention.title}</p>}
      <div className="mt-1.5 flex items-center gap-1.5">
        <Avatar name={memberName(tech)} color={tech?.color} size="xs" className="[&>span]:size-5 [&>span]:text-[9px] [&>span]:ring-1" />
        <span className="truncate text-[11.5px] font-medium text-slate-600">{memberName(tech, true)}</span>
      </div>
    </Link>
  );
}

function WeekView({ anchor, items, today }: { anchor: ISODate; items: Intervention[]; today: ISODate }) {
  const monday = startOfWeek(anchor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i)).filter(
    (d, i) => i < 5 || items.some((it) => it.date === d),
  );
  return (
    <div className="scrollbar-thin -mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      <div className="grid min-w-[720px] gap-3" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
        {days.map((day) => {
          const list = items.filter((i) => i.date === day).sort(byTime);
          const isToday = day === today;
          return (
            <div key={day} className={cn("flex min-h-[420px] flex-col rounded-2xl border p-2.5", isToday ? "border-electric/30 bg-electric-50/60" : "border-line bg-white/60")}>
              <div className="mb-2.5 flex items-center justify-between px-1">
                <div>
                  <p className={cn("text-[13px] font-bold", isToday ? "text-electric" : "text-navy")}>{formatWeekday(day)}</p>
                  <p className="text-[11px] text-muted">{formatDate(day, "short")}{isToday && " · aujourd'hui"}</p>
                </div>
                <span className={cn("tabular grid size-6 place-items-center rounded-lg text-[11px] font-bold", isToday ? "bg-electric text-white" : "bg-slate-100 text-slate-500")}>
                  {list.length}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2">
                {list.map((i) => <PlanningCard key={i.id} intervention={i} />)}
                {list.length === 0 && <p className="mt-6 text-center text-xs text-slate-400">Aucune intervention</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const START_HOUR = 7;
const END_HOUR = 19;
const HOUR_PX = 64;

function DayView({ day, items }: { day: ISODate; items: Intervention[] }) {
  const { data } = useStore();
  const technicians = data.team.filter((m) => m.appRole === "technicien");
  const list = items.filter((i) => i.date === day);
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

  return (
    <>
      {/* Smartphone : liste chronologique */}
      <div className="space-y-2 md:hidden">
        {list.sort(byTime).map((i) => <PlanningCard key={i.id} intervention={i} />)}
        {list.length === 0 && <p className="py-10 text-center text-sm text-muted">Aucune intervention ce jour.</p>}
      </div>

      {/* Tablette / ordinateur : colonnes par technicien sur une grille horaire */}
      <Card className="hidden overflow-hidden md:block">
        <div className="grid border-b border-line" style={{ gridTemplateColumns: `64px repeat(${technicians.length}, minmax(0, 1fr))` }}>
          <div />
          {technicians.map((t) => (
            <div key={t.id} className="flex items-center gap-2 border-l border-line px-3 py-3">
              <Avatar name={`${t.firstName} ${t.lastName}`} color={t.color} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-navy">{t.firstName} {t.lastName}</p>
                <p className="text-[11px] text-muted">{list.filter((i) => i.technicianId === t.id).length} intervention(s)</p>
              </div>
            </div>
          ))}
        </div>
        <div className="scrollbar-thin max-h-[640px] overflow-y-auto">
          <div className="relative grid" style={{ gridTemplateColumns: `64px repeat(${technicians.length}, minmax(0, 1fr))`, height: (END_HOUR - START_HOUR) * HOUR_PX + 16 }}>
            <div className="relative">
              {hours.map((h) => (
                <span key={h} className="tabular absolute right-3 -translate-y-1/2 text-[11px] text-slate-400" style={{ top: (h - START_HOUR) * HOUR_PX + 8 }}>
                  {String(h).padStart(2, "0")}:00
                </span>
              ))}
            </div>
            {technicians.map((t) => (
              <div key={t.id} className="relative border-l border-line">
                {hours.map((h) => (
                  <div key={h} className="absolute inset-x-0 border-t border-dashed border-slate-100" style={{ top: (h - START_HOUR) * HOUR_PX + 8 }} />
                ))}
                {list
                  .filter((i) => i.technicianId === t.id && i.time)
                  .map((i) => {
                    const [h, m] = i.time!.split(":").map(Number);
                    const top = Math.max(0, (h + m / 60 - START_HOUR) * HOUR_PX) + 8;
                    const height = Math.max(56, (i.durationMin / 60) * HOUR_PX - 4);
                    const client = getClient(data, i.clientId);
                    return (
                      <Link
                        key={i.id}
                        href={`/interventions/${i.id}`}
                        className={cn(
                          "absolute inset-x-1.5 animate-scale-in overflow-hidden rounded-xl border bg-white p-2.5 shadow-card transition hover:z-10 hover:shadow-card-hover",
                          i.status === "EN_COURS" ? "border-cyan-300 ring-2 ring-cyan-brand/20" : "border-line",
                        )}
                        style={{ top, height }}
                      >
                        <span className={cn("absolute inset-y-0 left-0 w-1", STATUS_BAR[i.status])} />
                        <p className="tabular text-[11px] font-bold text-navy">
                          {i.time} – {addMinutesToTime(i.time!, i.durationMin)}
                        </p>
                        <p className="truncate text-[13px] font-semibold text-ink">{client?.name}</p>
                        <p className="truncate text-[11.5px] text-muted">{i.title}</p>
                        {height > 90 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            <StatusBadge status={i.status} size="xs" />
                            {i.priority !== "NORMALE" && <PriorityBadge priority={i.priority} size="xs" />}
                          </div>
                        )}
                      </Link>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </>
  );
}

function MonthView({ anchor, items, today, onPick }: { anchor: ISODate; items: Intervention[]; today: ISODate; onPick: (day: ISODate) => void }) {
  const { data } = useStore();
  const first = startOfMonth(anchor);
  const gridStart = startOfWeek(first);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const month = first.slice(0, 7);
  const weekdays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-7 border-b border-line bg-slate-50/70">
        {weekdays.map((d) => (
          <p key={d} className="py-2.5 text-center text-[10.5px] font-semibold tracking-wider text-slate-500 uppercase">{d}</p>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          const list = items.filter((i) => i.date === day).sort(byTime);
          const inMonth = day.startsWith(month);
          const isToday = day === today;
          return (
            <button
              key={day}
              onClick={() => onPick(day)}
              className={cn(
                "group flex min-h-[72px] flex-col gap-1 border-line p-1.5 text-left transition hover:bg-electric-50/50 sm:min-h-[104px] sm:p-2",
                idx % 7 !== 6 && "border-r",
                idx < 35 && "border-b",
                !inMonth && "bg-slate-50/50",
              )}
            >
              <span
                className={cn(
                  "tabular grid size-6 place-items-center rounded-lg text-xs font-semibold",
                  isToday ? "bg-electric text-white" : inMonth ? "text-navy" : "text-slate-300",
                )}
              >
                {fromISODate(day).getDate()}
              </span>
              <span className="hidden flex-col gap-0.5 sm:flex">
                {list.slice(0, 3).map((i) => (
                  <span key={i.id} className="flex items-center gap-1 truncate rounded-md bg-white px-1.5 py-0.5 text-[10.5px] text-slate-600 ring-1 ring-line">
                    <span className={cn("size-1.5 shrink-0 rounded-full", STATUS_BAR[i.status])} />
                    <span className="tabular font-semibold text-navy">{i.time}</span>
                    <span className="truncate">{getClient(data, i.clientId)?.name}</span>
                  </span>
                ))}
                {list.length > 3 && <span className="px-1 text-[10.5px] font-semibold text-electric">+{list.length - 3} autre(s)</span>}
              </span>
              {list.length > 0 && (
                <span className="flex gap-0.5 sm:hidden">
                  {list.slice(0, 4).map((i) => <span key={i.id} className={cn("size-1.5 rounded-full", STATUS_BAR[i.status])} />)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

export function PlanningView() {
  const { data, today } = useStore();
  const [view, setView] = useState<View>("week");
  const [anchor, setAnchor] = useState<ISODate>(today);
  const [techFilter, setTechFilter] = useState<string>("all");
  const [creating, setCreating] = useState(false);
  const [scheduling, setScheduling] = useState<Intervention | null>(null);

  const items = useMemo(
    () =>
      data.interventions.filter(
        (i) => i.date && i.status !== "ANNULEE" && (techFilter === "all" || i.technicianId === techFilter),
      ),
    [data.interventions, techFilter],
  );
  const toPlan = data.interventions.filter((i) => i.status === "A_PLANIFIER");

  const move = (dir: -1 | 1) => {
    if (view === "day") setAnchor((a) => addDays(a, dir));
    else if (view === "week") setAnchor((a) => addDays(a, dir * 7));
    else {
      const d = fromISODate(anchor);
      d.setMonth(d.getMonth() + dir, 1);
      setAnchor(toISODate(d));
    }
  };

  const monday = startOfWeek(anchor);
  const rangeLabel =
    view === "day"
      ? formatDate(anchor, "long")
      : view === "week"
        ? `Semaine du ${fromISODate(monday).getDate()} au ${formatDate(addDays(monday, 4))}`
        : formatMonth(anchor);

  const techOptions = [
    { value: "all", label: "Toute l'équipe" },
    ...data.team.filter((m) => m.appRole === "technicien").map((m) => ({ value: m.id, label: m.firstName })),
  ];

  return (
    <>
      <PageHeader
        eyebrow="Organisation"
        title="Planning"
        subtitle="Le planning de l'équipe terrain, mis à jour en temps réel."
        actions={
          <Button icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>
            Nouvelle intervention
          </Button>
        }
      />

      <div className="mb-5 flex animate-fade-up flex-col gap-3 lg:flex-row lg:items-center lg:justify-between" style={{ animationDelay: "60ms" }}>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented options={VIEWS} value={view} onChange={setView} ariaLabel="Vue du planning" />
          <div className="flex items-center gap-1 rounded-xl border border-line bg-white p-1 shadow-card">
            <button onClick={() => move(-1)} className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-navy" aria-label="Période précédente">
              <ChevronLeft className="size-4" />
            </button>
            <button onClick={() => setAnchor(today)} className="h-8 rounded-lg px-3 text-[13px] font-semibold text-navy hover:bg-slate-100">
              Aujourd&apos;hui
            </button>
            <button onClick={() => move(1)} className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-navy" aria-label="Période suivante">
              <ChevronRight className="size-4" />
            </button>
          </div>
          <p className="px-1 text-sm font-semibold text-navy">{rangeLabel}</p>
        </div>
        <Segmented options={techOptions} value={techFilter} onChange={setTechFilter} size="sm" ariaLabel="Filtrer par technicien" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 animate-fade-up" style={{ animationDelay: "120ms" }}>
          {view === "week" && <WeekView anchor={anchor} items={items} today={today} />}
          {view === "day" && <DayView day={anchor} items={items} />}
          {view === "month" && (
            <MonthView
              anchor={anchor}
              items={items}
              today={today}
              onPick={(d) => {
                setAnchor(d);
                setView("day");
              }}
            />
          )}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
            {[
              ["bg-electric", "Planifiée"],
              ["bg-cyan-brand", "En cours"],
              ["bg-emerald-500", "Terminée"],
              ["bg-rose-500 size-1.5", "Urgente"],
            ].map(([c, l]) => (
              <span key={l} className="inline-flex items-center gap-1.5">
                <span className={cn("size-2.5 rounded-full", c)} /> {l}
              </span>
            ))}
          </div>
        </div>

        <Card className="h-fit animate-fade-up" style={{ animationDelay: "160ms" }}>
          <div className="flex items-center gap-3 border-b border-line px-5 py-4">
            <span className="grid size-9 place-items-center rounded-xl bg-amber-50 text-amber-700"><Inbox className="size-[18px]" /></span>
            <div>
              <p className="text-[15px] font-semibold text-navy">À planifier</p>
              <p className="text-xs text-muted">{toPlan.length} demande(s) en attente</p>
            </div>
          </div>
          <ul className="divide-y divide-line">
            {toPlan.map((i) => (
              <li key={i.id} className="px-5 py-3">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/interventions/${i.id}`} className="min-w-0">
                    <p className="truncate text-sm font-semibold text-navy hover:text-electric">{i.title}</p>
                    <p className="truncate text-xs text-muted">{getClient(data, i.clientId)?.name}</p>
                  </Link>
                  <PriorityBadge priority={i.priority} size="xs" />
                </div>
                <Button variant="secondary" size="sm" className="mt-2 w-full" icon={<CalendarCheck className="size-3.5" />} onClick={() => setScheduling(i)}>
                  Planifier
                </Button>
              </li>
            ))}
            {toPlan.length === 0 && <li className="px-5 py-8 text-center text-sm text-muted">Tout est planifié ✓</li>}
          </ul>
        </Card>
      </div>

      <InterventionForm open={creating} onClose={() => setCreating(false)} prefill={{ date: view === "day" ? anchor : today }} />
      <ScheduleModal intervention={scheduling} onClose={() => setScheduling(null)} />
    </>
  );
}
