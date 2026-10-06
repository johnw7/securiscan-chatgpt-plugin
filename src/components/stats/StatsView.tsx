"use client";

import { useMemo } from "react";
import { CheckCircle2, Euro, Star, Timer, Wrench } from "lucide-react";
import { useStore } from "@/lib/store/AppStore";
import { computeKpis } from "@/lib/store/selectors";
import { MONTHLY_INTERVENTIONS, MONTHLY_REVENUE, QUALITY, TYPE_SHARE } from "@/lib/data/stats";
import { TYPE_META } from "@/lib/constants";
import { formatDuration, formatMonth, fromISODate, toISODate } from "@/lib/dates";
import { formatCurrency } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { AreaTrendChart } from "@/components/charts/AreaTrendChart";
import { BarVolumeChart } from "@/components/charts/BarVolumeChart";
import { DonutChart } from "@/components/charts/DonutChart";

export function StatsView() {
  const { data, seed, today } = useStore();
  const month = computeKpis(data, seed, "month", today);

  const months = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const d = fromISODate(today);
        d.setMonth(d.getMonth() - (5 - i), 1);
        return formatMonth(toISODate(d), "short").replace(".", "");
      }),
    [today],
  );

  const revenue = months.map((label, i) => ({ label, value: i === 5 ? month.revenue : MONTHLY_REVENUE[i] }));
  const volume = months.map((label, i) => ({ label, value: i === 5 ? month.interventions : MONTHLY_INTERVENTIONS[i], highlight: i === 5 }));
  const sixMonthsRevenue = revenue.reduce((s, d) => s + d.value, 0);
  const types = (Object.keys(TYPE_SHARE) as (keyof typeof TYPE_SHARE)[]).map((t) => ({ name: TYPE_META[t].label, value: TYPE_SHARE[t], color: TYPE_META[t].color }));
  const technicians = data.team.filter((m) => m.appRole === "technicien");
  const maxMonth = Math.max(...technicians.map((t) => t.monthInterventions));

  return (
    <>
      <PageHeader eyebrow="Pilotage" title="Statistiques" subtitle={`Indicateurs de performance · ${formatMonth(today)}`} />

      <section className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        <StatCard accent label="Chiffre d'affaires" value={month.revenue} format={(v) => formatCurrency(v)} trend={8} trendLabel="vs mois dernier" icon={<Euro className="size-[18px]" />} />
        <StatCard label="Interventions" value={month.interventions} trend={5} trendLabel="vs mois dernier" icon={<Wrench className="size-[18px]" />} style={{ animationDelay: "60ms" }} />
        <StatCard label="Taux de résolution" value={QUALITY.resolutionRate} suffix={<span className="text-xl">%</span>} trend={QUALITY.resolutionTrend} trendLabel="dès le 1er passage" icon={<CheckCircle2 className="size-[18px]" />} style={{ animationDelay: "120ms" }} />
        <StatCard
          label="Temps moyen d'intervention"
          value={QUALITY.avgDurationMin}
          format={(v) => formatDuration(Math.round(v))}
          trend={QUALITY.avgDurationTrend}
          invertTrend
          trendLabel="vs mois dernier"
          icon={<Timer className="size-[18px]" />}
          style={{ animationDelay: "180ms" }}
        />
        <StatCard
          label="Satisfaction client"
          value={QUALITY.satisfaction}
          format={(v) => v.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          suffix={<span className="text-base text-muted">/5</span>}
          trendLabel={`${QUALITY.satisfactionReviews} avis`}
          trend={2}
          icon={<Star className="size-[18px]" />}
          style={{ animationDelay: "240ms" }}
        />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="animate-fade-up" style={{ animationDelay: "120ms" }}>
          <CardHeader title="CA des 6 derniers mois" subtitle={`${formatCurrency(sixMonthsRevenue)} HT cumulés · +${Math.round(((revenue[5].value - revenue[0].value) / revenue[0].value) * 100)} % sur la période`} />
          <div className="px-3 pb-4"><AreaTrendChart data={revenue} name="Chiffre d'affaires" format={(v) => formatCurrency(v)} /></div>
        </Card>
        <Card className="animate-fade-up" style={{ animationDelay: "160ms" }}>
          <CardHeader title="Interventions par mois" subtitle={`${volume.reduce((s, d) => s + d.value, 0)} interventions sur 6 mois`} />
          <div className="px-3 pb-4"><BarVolumeChart data={volume} height={260} unit="interventions" /></div>
        </Card>
        <Card className="animate-fade-up" style={{ animationDelay: "200ms" }}>
          <CardHeader title="Types d'intervention" subtitle="Répartition du mois en cours" />
          <div className="px-5 pb-6 sm:px-8"><DonutChart data={types} centerValue={String(month.interventions)} centerLabel="interventions" size={200} /></div>
        </Card>
        <Card className="animate-fade-up" style={{ animationDelay: "240ms" }}>
          <CardHeader title="Performance de l'équipe" subtitle="Interventions réalisées ce mois, satisfaction et ponctualité" />
          <ul className="space-y-5 px-5 pb-6">
            {technicians.map((t) => (
              <li key={t.id}>
                <div className="mb-2 flex items-center gap-3">
                  <Avatar name={`${t.firstName} ${t.lastName}`} color={t.color} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-navy">{t.firstName} {t.lastName}</p>
                    <p className="text-xs text-muted">★ {t.satisfaction.toLocaleString("fr-FR")} · ponctualité {t.onTimeRate} %</p>
                  </div>
                  <p className="tabular font-display text-lg font-bold text-navy">{t.monthInterventions}</p>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100" title={`${t.monthInterventions} interventions`}>
                  <div className="h-full rounded-full bg-brand-gradient transition-all duration-700" style={{ width: `${(t.monthInterventions / maxMonth) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </>
  );
}
