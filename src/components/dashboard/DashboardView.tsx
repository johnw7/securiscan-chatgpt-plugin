"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CalendarClock, CheckCircle2, Clock3, Euro, MapPin, Plus, Activity as ActivityIcon2, Wrench } from "lucide-react";
import type { Period } from "@/lib/types";
import { useStore } from "@/lib/store/AppStore";
import { computeKpis, getClient, getMember, interventionsOn, memberName, memberStatus } from "@/lib/store/selectors";
import { LAST_DAYS_VOLUME, TYPE_SHARE } from "@/lib/data/stats";
import { TYPE_META, MEMBER_STATUS_META } from "@/lib/constants";
import { addBusinessDays, formatDate, formatRelative, formatWeekday, fromISODate } from "@/lib/dates";
import { formatCurrency } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Segmented } from "@/components/ui/Segmented";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/interventions/Badges";
import { InterventionForm } from "@/components/interventions/InterventionForm";
import { ActivityIcon } from "@/components/layout/ActivityIcon";
import { BarVolumeChart } from "@/components/charts/BarVolumeChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { cn } from "@/lib/utils";

const PERIODS: { value: Period; label: string }[] = [
  { value: "today", label: "Aujourd'hui" },
  { value: "week", label: "Cette semaine" },
  { value: "month", label: "Ce mois" },
];

const PERIOD_TREND_LABEL: Record<Period, string> = {
  today: "vs hier",
  week: "vs semaine dernière",
  month: "vs mois dernier",
};

export function DashboardView() {
  const { data, seed, today } = useStore();
  const [period, setPeriod] = useState<Period>("today");
  const [creating, setCreating] = useState(false);

  const kpis = computeKpis(data, seed, period, today);
  const todayKpis = computeKpis(data, seed, "today", today);
  const monthKpis = computeKpis(data, seed, "month", today);
  const todays = interventionsOn(data, today);
  const upcoming = todays.filter((i) => i.status !== "TERMINEE");
  const doneToday = todays.length - upcoming.length;

  const volume = useMemo(() => {
    const days = LAST_DAYS_VOLUME.map((value, i) => {
      const date = addBusinessDays(today, i - LAST_DAYS_VOLUME.length);
      return { label: `${formatWeekday(date, "short").replace(".", "")} ${fromISODate(date).getDate()}`, value };
    });
    return [...days, { label: "Auj.", value: todayKpis.interventions, highlight: true }];
  }, [today, todayKpis.interventions]);

  const totalVolume = volume.reduce((s, d) => s + d.value, 0);
  const share = (Object.keys(TYPE_SHARE) as (keyof typeof TYPE_SHARE)[]).map((type) => ({
    name: TYPE_META[type].label,
    value: TYPE_SHARE[type],
    color: TYPE_META[type].color,
  }));

  const technicians = data.team.filter((m) => m.appRole === "technicien");

  return (
    <>
      <div className="mb-6 flex animate-fade-up flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-electric uppercase">{formatDate(today, "long")}</p>
          <h1 className="text-2xl font-bold text-navy sm:text-[30px]">Bonjour {data.settings.ownerFirstName} 👋</h1>
          <p className="mt-1 text-sm text-muted sm:text-[15px]">Voici l&apos;activité de votre entreprise aujourd&apos;hui.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented options={PERIODS} value={period} onChange={setPeriod} ariaLabel="Période" />
          <Button onClick={() => setCreating(true)} icon={<Plus className="size-4" />} className="hidden sm:inline-flex">
            Nouvelle intervention
          </Button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4" aria-label="Indicateurs clés">
        <StatCard
          label={period === "today" ? "Interventions aujourd'hui" : period === "week" ? "Interventions cette semaine" : "Interventions ce mois"}
          value={kpis.interventions}
          trend={kpis.trends.interventions}
          trendLabel={PERIOD_TREND_LABEL[period]}
          icon={<Wrench className="size-[18px]" />}
        />
        <StatCard
          label="En cours"
          value={kpis.inProgress}
          trend={kpis.trends.inProgress}
          trendLabel={PERIOD_TREND_LABEL[period]}
          icon={<Clock3 className="size-[18px]" />}
          style={{ animationDelay: "60ms" }}
        />
        <StatCard
          label="Terminées"
          value={kpis.done}
          trend={kpis.trends.done}
          trendLabel={PERIOD_TREND_LABEL[period]}
          icon={<CheckCircle2 className="size-[18px]" />}
          style={{ animationDelay: "120ms" }}
        />
        <StatCard
          accent
          label={kpis.revenueLabel}
          value={kpis.revenue}
          format={(v) => formatCurrency(v)}
          trend={kpis.trends.revenue}
          trendLabel={period === "week" ? "vs semaine dernière" : "vs mois dernier"}
          icon={<Euro className="size-[18px]" />}
          style={{ animationDelay: "180ms" }}
        />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="animate-fade-up xl:col-span-2" style={{ animationDelay: "120ms" }}>
          <CardHeader
            title="Planning du jour"
            subtitle={`${upcoming.length} intervention${upcoming.length > 1 ? "s" : ""} à venir ou en cours · ${doneToday} terminée${doneToday > 1 ? "s" : ""}`}
            icon={<CalendarClock className="size-[18px]" />}
            action={
              <ButtonLink href="/planning" variant="ghost" size="sm" iconRight={<ArrowRight className="size-3.5" />} className="hidden sm:inline-flex">
                Voir le planning complet
              </ButtonLink>
            }
          />
          <ul className="divide-y divide-line px-2 pb-2">
            {upcoming.map((i, idx) => {
              const client = getClient(data, i.clientId);
              const tech = getMember(data, i.technicianId);
              return (
                <li key={i.id} className="animate-fade-up" style={{ animationDelay: `${160 + idx * 50}ms` }}>
                  <Link
                    href={`/interventions/${i.id}`}
                    className="group flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-slate-50 sm:gap-4"
                  >
                    <div className="w-14 shrink-0 text-center">
                      <p className="tabular font-display text-[17px] font-bold text-navy">{i.time}</p>
                      <div className={cn("mx-auto mt-1 h-1 w-8 rounded-full", i.status === "EN_COURS" ? "bg-brand-gradient" : "bg-slate-200")} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-navy group-hover:text-electric">{i.title}</p>
                      <p className="truncate text-[13px] text-slate-500">{client?.name}</p>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted sm:hidden">
                        <Avatar name={memberName(tech)} color={tech?.color} size="xs" className="-my-1" /> {memberName(tech)}
                      </p>
                    </div>
                    <div className="hidden w-40 shrink-0 items-center gap-2 sm:flex">
                      <Avatar name={memberName(tech)} color={tech?.color} size="sm" />
                      <div className="min-w-0 leading-tight">
                        <p className="text-[10.5px] tracking-wide text-muted uppercase">Technicien</p>
                        <p className="truncate text-[13px] font-medium text-ink">{memberName(tech)}</p>
                      </div>
                    </div>
                    <StatusBadge status={i.status} label={i.status === "PLANIFIEE" ? "À venir" : undefined} />
                  </Link>
                </li>
              );
            })}
            {upcoming.length === 0 && <li className="px-3 py-10 text-center text-sm text-muted">Toutes les interventions du jour sont terminées. 🎉</li>}
          </ul>
          <div className="border-t border-line p-3 sm:hidden">
            <ButtonLink href="/planning" variant="secondary" className="w-full" iconRight={<ArrowRight className="size-4" />}>
              Voir le planning complet
            </ButtonLink>
          </div>
        </Card>

        <Card className="animate-fade-up" style={{ animationDelay: "180ms" }}>
          <CardHeader title="Activité récente" subtitle="Mise à jour en temps réel" icon={<ActivityIcon2 className="size-[18px]" />} />
          <ol className="relative px-5 pb-5">
            {data.activities.slice(0, 6).map((a, idx, list) => (
              <li key={a.id} className="relative flex animate-fade-up gap-3 pb-4 last:pb-0" style={{ animationDelay: `${200 + idx * 50}ms` }}>
                {idx < list.length - 1 && <span className="absolute top-8 bottom-0 left-[15px] w-px bg-line" />}
                <ActivityIcon kind={a.kind} />
                <div className="min-w-0 pt-0.5">
                  {a.href ? (
                    <Link href={a.href} className="text-[13px] leading-snug text-ink hover:text-electric">
                      {a.text}
                    </Link>
                  ) : (
                    <p className="text-[13px] leading-snug text-ink">{a.text}</p>
                  )}
                  <p className="mt-0.5 text-[11px] text-muted">{formatRelative(a.at)}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="animate-fade-up xl:col-span-2" style={{ animationDelay: "200ms" }}>
          <CardHeader
            title="Interventions des 7 derniers jours"
            subtitle={`${totalVolume} interventions · moyenne ${(totalVolume / 7).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} par jour ouvré`}
          />
          <div className="px-3 pb-4">
            <BarVolumeChart data={volume} unit="interventions" />
          </div>
        </Card>
        <Card className="animate-fade-up" style={{ animationDelay: "240ms" }}>
          <CardHeader title="Répartition des interventions" subtitle="Ce mois, par type" />
          <div className="px-5 pb-6">
            <DonutChart data={share} centerValue={String(monthKpis.interventions)} centerLabel="interventions" size={180} stacked />
          </div>
        </Card>
      </section>

      <section className="mt-6">
        <Card className="animate-fade-up" style={{ animationDelay: "260ms" }}>
          <CardHeader
            title="Équipe terrain"
            subtitle="Statut en direct"
            action={
              <ButtonLink href="/equipe" variant="ghost" size="sm" iconRight={<ArrowRight className="size-3.5" />}>
                Voir l&apos;équipe
              </ButtonLink>
            }
          />
          <div className="grid grid-cols-1 gap-3 px-5 pb-5 sm:grid-cols-3">
            {technicians.map((m) => {
              const status = memberStatus(data, m);
              const current = data.interventions.find((i) => i.technicianId === m.id && i.status === "EN_COURS");
              const next = interventionsOn(data, today).find((i) => i.technicianId === m.id && i.status === "PLANIFIEE");
              const where = current ?? next;
              return (
                <div key={m.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                  <Avatar name={`${m.firstName} ${m.lastName}`} color={m.color} status={status === "EN_INTERVENTION" ? "busy" : "online"} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-navy">{m.firstName} {m.lastName}</p>
                      <Badge tone={MEMBER_STATUS_META[status].tone} size="xs">{MEMBER_STATUS_META[status].label}</Badge>
                    </div>
                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted">
                      <MapPin className="size-3 shrink-0" />
                      {where ? `${current ? "Sur site" : `Prochaine à ${where.time}`} · ${getClient(data, where.clientId)?.name}` : "Aucune intervention prévue"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      <InterventionForm open={creating} onClose={() => setCreating(false)} />
    </>
  );
}
