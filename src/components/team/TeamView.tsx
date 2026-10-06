"use client";

import Link from "next/link";
import { Mail, MapPin, Phone, Star, Timer, Users, Wrench } from "lucide-react";
import { useStore } from "@/lib/store/AppStore";
import { getClient, interventionsOn, memberStatus, memberWeekCount } from "@/lib/store/selectors";
import { MEMBER_STATUS_META } from "@/lib/constants";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { StatCard } from "@/components/ui/StatCard";

const WEEK_CAPACITY = 10;

export function TeamView() {
  const { data, seed, today } = useStore();
  const todays = interventionsOn(data, today);
  const technicians = data.team.filter((m) => m.appRole === "technicien");
  const onSite = technicians.filter((m) => memberStatus(data, m) === "EN_INTERVENTION").length;
  const weekTotal = technicians.reduce((s, m) => s + (memberWeekCount(data, seed, m, today) ?? 0), 0);

  return (
    <>
      <PageHeader eyebrow="Ressources" title="Équipe" subtitle={`${data.team.length} collaborateurs · ${technicians.length} techniciens terrain`} />

      <section className="mb-6 grid grid-cols-1 gap-4 min-[480px]:grid-cols-3">
        <StatCard label="Techniciens sur site" value={onSite} icon={<MapPin className="size-[18px]" />} />
        <StatCard label="Interventions cette semaine" value={weekTotal} icon={<Wrench className="size-[18px]" />} trend={9} trendLabel="vs semaine dernière" style={{ animationDelay: "60ms" }} />
        <StatCard label="Satisfaction moyenne" value={4.8} format={(v) => v.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} suffix={<span className="text-base text-muted">/5</span>} icon={<Star className="size-[18px]" />} style={{ animationDelay: "120ms" }} />
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-4">
        {data.team.map((m, idx) => {
          const status = memberStatus(data, m);
          const week = memberWeekCount(data, seed, m, today);
          const current = data.interventions.find((i) => i.technicianId === m.id && i.status === "EN_COURS");
          const next = todays.find((i) => i.technicianId === m.id && i.status === "PLANIFIEE");
          const name = `${m.firstName} ${m.lastName}`;
          return (
            <Card key={m.id} interactive className="flex animate-fade-up flex-col p-5" style={{ animationDelay: `${120 + idx * 60}ms` }}>
              <div className="flex items-start justify-between gap-3">
                <Avatar name={name} color={m.color} size="lg" status={status === "EN_INTERVENTION" ? "busy" : status === "ABSENT" ? "offline" : "online"} />
                <Badge tone={MEMBER_STATUS_META[status].tone} pulse={status === "EN_INTERVENTION"}>{MEMBER_STATUS_META[status].label}</Badge>
              </div>
              <h3 className="mt-4 text-lg font-bold text-navy">{name}</h3>
              <p className="text-sm text-muted">{m.role} · <span className="text-slate-500">{ROLE_LABELS[m.appRole]}</span></p>

              {week !== null ? (
                <div className="mt-4">
                  <div className="mb-1.5 flex items-baseline justify-between text-sm">
                    <span className="font-semibold text-navy"><span className="tabular">{week}</span> interventions cette semaine</span>
                    <span className="tabular text-xs text-muted">{Math.round((week / WEEK_CAPACITY) * 100)} %</span>
                  </div>
                  <Progress value={(week / WEEK_CAPACITY) * 100} />
                </div>
              ) : (
                <div className="mt-4 rounded-xl bg-electric-50/70 p-3 text-sm text-navy">
                  <p className="font-semibold">Coordination du planning</p>
                  <p className="text-xs text-slate-600">{data.interventions.filter((i) => i.status === "A_PLANIFIER").length} demandes à planifier · {todays.length} interventions aujourd&apos;hui</p>
                </div>
              )}

              {m.appRole === "technicien" && (
                <div className="mt-4 rounded-xl border border-line p-3 text-xs">
                  {current ?? next ? (
                    <Link href={`/interventions/${(current ?? next)!.id}`} className="block hover:text-electric">
                      <p className="font-semibold text-slate-500 uppercase tracking-wide text-[10px]">{current ? "En intervention" : `Prochaine · ${next!.time}`}</p>
                      <p className="mt-0.5 truncate text-[13px] font-semibold text-navy">{getClient(data, (current ?? next)!.clientId)?.name}</p>
                      <p className="truncate text-muted">{(current ?? next)!.title}</p>
                    </Link>
                  ) : (
                    <p className="text-muted">Aucune autre intervention aujourd&apos;hui</p>
                  )}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-1.5">
                {m.skills.map((s) => (
                  <span key={s} className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">{s}</span>
                ))}
              </div>

              <div className="mt-auto grid grid-cols-3 gap-2 border-t border-line pt-4 text-center text-xs">
                <div>
                  <p className="flex items-center justify-center gap-1 font-bold text-navy"><Star className="size-3 fill-amber-400 text-amber-400" />{m.satisfaction.toLocaleString("fr-FR")}</p>
                  <p className="text-muted">Satisfaction</p>
                </div>
                <div>
                  <p className="flex items-center justify-center gap-1 font-bold text-navy"><Timer className="size-3 text-electric" />{m.onTimeRate} %</p>
                  <p className="text-muted">Ponctualité</p>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <a href={`tel:${m.phone.replace(/\s/g, "")}`} className="grid size-8 place-items-center rounded-lg bg-slate-50 text-slate-500 hover:bg-electric-50 hover:text-electric" aria-label={`Appeler ${name}`}><Phone className="size-4" /></a>
                  <a href={`mailto:${m.email}`} className="grid size-8 place-items-center rounded-lg bg-slate-50 text-slate-500 hover:bg-electric-50 hover:text-electric" aria-label={`Écrire à ${name}`}><Mail className="size-4" /></a>
                </div>
              </div>
            </Card>
          );
        })}
      </section>

      <p className="mt-6 flex items-center gap-2 text-xs text-muted">
        <Users className="size-3.5" /> Chaque collaborateur dispose de son propre accès (administrateur, planification ou technicien) dans la version connectée.
      </p>
    </>
  );
}
