"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft, CalendarDays, Camera, CheckCircle2, ChevronRight, Clock3, FileText, House, ListChecks,
  MapPin, Navigation, PenLine, Phone, Play, Star, User, Wrench,
} from "lucide-react";
import type { Intervention } from "@/lib/types";
import { useStore } from "@/lib/store/AppStore";
import { useAppActions } from "@/lib/store/useAppActions";
import { byTime, getClient, interventionsOn } from "@/lib/store/selectors";
import { addDays, formatDate, formatDuration, formatWeekday, startOfWeek } from "@/lib/dates";
import { BRAND } from "@/config/brand";
import { mapsUrl, cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { Progress } from "@/components/ui/Progress";
import { PriorityBadge, StatusBadge } from "@/components/interventions/Badges";
import { Checklist } from "@/components/interventions/Checklist";
import { PhotoGallery } from "@/components/interventions/PhotoGallery";
import { ReportEditor } from "@/components/interventions/ReportEditor";
import { SignaturePad } from "@/components/interventions/SignaturePad";

type Tab = "today" | "planning" | "interventions" | "profile";
type Section = "checklist" | "photos" | "report" | "signature";

const TABS: { value: Tab; label: string; icon: typeof House }[] = [
  { value: "today", label: "Aujourd'hui", icon: House },
  { value: "planning", label: "Planning", icon: CalendarDays },
  { value: "interventions", label: "Interventions", icon: Wrench },
  { value: "profile", label: "Profil", icon: User },
];

const DEFAULT_TECH = "tech-thomas";

/* ——————————————————— Écrans ——————————————————— */

function MissionCard({ intervention, label, onOpen }: { intervention: Intervention; label: string; onOpen: () => void }) {
  const { data } = useStore();
  const actions = useAppActions();
  const client = getClient(data, intervention.clientId);
  const running = intervention.status === "EN_COURS";

  return (
    <div className="animate-fade-up overflow-hidden rounded-3xl bg-white shadow-card-hover ring-1 ring-line">
      <button onClick={onOpen} className="block w-full p-5 text-left">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-electric uppercase">{label}</p>
          <StatusBadge status={intervention.status} size="xs" label={intervention.status === "PLANIFIEE" ? "À venir" : undefined} />
        </div>
        <p className="tabular mt-3 font-display text-[40px] leading-none font-extrabold text-navy">{intervention.time}</p>
        <p className="mt-3 text-lg font-bold text-navy">{client?.name}</p>
        <p className="text-[15px] text-slate-600">{intervention.title}</p>
        <p className="mt-3 flex items-start gap-1.5 text-sm text-slate-500">
          <MapPin className="mt-0.5 size-4 shrink-0 text-electric" />
          {intervention.address}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
          <span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" /> {formatDuration(intervention.durationMin)}</span>
          {intervention.priority !== "NORMALE" && <PriorityBadge priority={intervention.priority} size="xs" />}
        </div>
      </button>
      <div className="grid grid-cols-2 gap-2 border-t border-line bg-slate-50/70 p-3">
        <a
          href={mapsUrl(intervention.address)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-line bg-white text-sm font-bold tracking-wide text-navy uppercase active:scale-[0.98]"
        >
          <Navigation className="size-5 text-electric" /> Itinéraire
        </a>
        <button
          onClick={() => {
            if (!running) actions.startIntervention(intervention.id);
            onOpen();
          }}
          className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-brand-gradient text-sm font-bold tracking-wide text-white uppercase shadow-glow active:scale-[0.98]"
        >
          {running ? <ChevronRight className="size-5" /> : <Play className="size-5" />} {running ? "Continuer" : "Commencer"}
        </button>
      </div>
    </div>
  );
}

function MiniRow({ intervention, onOpen }: { intervention: Intervention; onOpen: () => void }) {
  const { data } = useStore();
  const done = intervention.status === "TERMINEE";
  return (
    <button onClick={onOpen} className="flex w-full items-center gap-3 rounded-2xl bg-white p-3.5 text-left ring-1 ring-line active:bg-slate-50">
      <div className={cn("w-14 shrink-0 rounded-xl py-2 text-center", done ? "bg-emerald-50" : "bg-electric-50")}>
        <p className={cn("tabular text-sm font-bold", done ? "text-emerald-700" : "text-electric")}>{intervention.time}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-navy">{getClient(data, intervention.clientId)?.name}</p>
        <p className="truncate text-[13px] text-muted">{intervention.title}</p>
      </div>
      {done ? <CheckCircle2 className="size-5 text-emerald-500" /> : <ChevronRight className="size-5 text-slate-300" />}
    </button>
  );
}

function TodayScreen({ techId, onOpen }: { techId: string; onOpen: (id: string) => void }) {
  const { data, today } = useStore();
  const tech = data.team.find((m) => m.id === techId)!;
  const mine = interventionsOn(data, today).filter((i) => i.technicianId === techId);
  const done = mine.filter((i) => i.status === "TERMINEE").length;
  const active = mine.find((i) => i.status === "EN_COURS") ?? mine.find((i) => i.status === "PLANIFIEE");
  const isFirst = active && mine.filter((i) => i.status === "TERMINEE").length === 0 && active.status === "PLANIFIEE";
  const rest = mine.filter((i) => i.id !== active?.id);

  return (
    <div>
      <div className="relative overflow-hidden bg-navy px-5 pt-6 pb-16 text-white">
        <div className="pointer-events-none absolute -top-20 -right-16 size-56 rounded-full bg-brand-gradient opacity-50 blur-2xl" />
        <p className="relative text-xs text-white/60">{formatDate(today, "long")}</p>
        <h1 className="relative mt-1 font-display text-[26px] font-bold">Bonjour {tech.firstName} 👋</h1>
        <p className="relative mt-1 text-[15px] text-white/80">
          <strong className="text-white">{mine.length} interventions</strong> aujourd&apos;hui
        </p>
        <div className="relative mt-4 flex items-center gap-3">
          <Progress value={(done / Math.max(1, mine.length)) * 100} className="bg-white/15" />
          <span className="tabular shrink-0 text-xs font-semibold text-white/80">{done}/{mine.length}</span>
        </div>
      </div>

      <div className="-mt-10 space-y-5 px-4 pb-6">
        {active ? (
          <MissionCard
            intervention={active}
            label={active.status === "EN_COURS" ? "Intervention en cours" : isFirst ? "Première intervention" : "Prochaine intervention"}
            onOpen={() => onOpen(active.id)}
          />
        ) : (
          <div className="animate-fade-up rounded-3xl bg-white p-6 text-center shadow-card-hover ring-1 ring-line">
            <CheckCircle2 className="mx-auto size-10 text-emerald-500" />
            <p className="mt-3 font-display text-lg font-bold text-navy">Journée terminée !</p>
            <p className="text-sm text-muted">Toutes vos interventions sont clôturées.</p>
          </div>
        )}

        {rest.length > 0 && (
          <div>
            <p className="mb-2 px-1 text-xs font-semibold tracking-[0.12em] text-muted uppercase">Votre journée</p>
            <div className="space-y-2">
              {rest.map((i) => <MiniRow key={i.id} intervention={i} onOpen={() => onOpen(i.id)} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StepCard({ n, title, icon, done, children, id }: { n: number; title: string; icon: ReactNode; done: boolean; children: ReactNode; id: string }) {
  return (
    <section id={id} className="scroll-mt-20 rounded-3xl bg-white p-4 ring-1 ring-line">
      <div className="mb-4 flex items-center gap-3">
        <span className={cn("grid size-9 place-items-center rounded-xl text-sm font-bold", done ? "bg-emerald-500 text-white" : "bg-electric-50 text-electric")}>
          {done ? <CheckCircle2 className="size-5" /> : n}
        </span>
        <h2 className="flex-1 text-base font-bold text-navy">{title}</h2>
        <span className="text-slate-300">{icon}</span>
      </div>
      {children}
    </section>
  );
}

function InterventionScreen({ id, section, onBack, onNext }: { id: string; section?: Section; onBack: () => void; onNext: () => void }) {
  const { data } = useStore();
  const actions = useAppActions();
  const intervention = data.interventions.find((i) => i.id === id);
  const scroller = useRef<HTMLDivElement>(null);
  const [justFinished, setJustFinished] = useState(false);

  useEffect(() => {
    if (!section) return;
    const t = window.setTimeout(() => document.getElementById(`step-${section}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 250);
    return () => window.clearTimeout(t);
  }, [section, intervention?.status]);

  if (!intervention) return <p className="p-6 text-center text-muted">Intervention introuvable.</p>;
  const client = getClient(data, intervention.clientId);
  const status = intervention.status;
  const running = status === "EN_COURS";

  if (justFinished && status === "TERMINEE") {
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-6 py-16 text-center">
        <span className="grid size-20 animate-scale-in place-items-center rounded-full bg-emerald-500 text-white shadow-[0_12px_32px_-8px_rgb(16_185_129/0.6)]">
          <CheckCircle2 className="size-10" />
        </span>
        <h2 className="mt-6 animate-fade-up font-display text-2xl font-bold text-navy">Intervention terminée avec succès</h2>
        <p className="mt-2 animate-fade-up text-sm text-muted" style={{ animationDelay: "80ms" }}>
          {intervention.id} · {client?.name}
          <br />Rapport signé envoyé à {client?.contactName}.
        </p>
        <div className="mt-8 w-full max-w-xs animate-fade-up space-y-2" style={{ animationDelay: "160ms" }}>
          <button onClick={onNext} className="h-14 w-full rounded-2xl bg-brand-gradient text-sm font-bold tracking-wide text-white uppercase shadow-glow">
            Intervention suivante
          </button>
          <button onClick={onBack} className="h-12 w-full rounded-2xl text-sm font-semibold text-slate-500">Retour à ma journée</button>
        </div>
      </div>
    );
  }

  const checklistDone = intervention.checklist.every((c) => c.done);

  return (
    <div ref={scroller}>
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-white/90 px-4 py-3 backdrop-blur">
        <button onClick={onBack} className="grid size-10 place-items-center rounded-xl text-navy active:bg-slate-100" aria-label="Retour">
          <ArrowLeft className="size-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="tabular text-[11px] font-semibold text-muted">{intervention.id}</p>
          <p className="truncate text-[15px] font-bold text-navy">{client?.name}</p>
        </div>
        <StatusBadge status={status} size="xs" />
      </div>

      <div className="space-y-4 p-4 pb-8">
        <div className="rounded-3xl bg-white p-4 ring-1 ring-line">
          <p className="text-lg font-bold text-navy">{intervention.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{intervention.description}</p>
          <div className="mt-4 space-y-2 text-sm">
            <p className="flex items-center gap-2 text-slate-600"><Clock3 className="size-4 text-electric" /> {intervention.time} · {formatDuration(intervention.durationMin)}</p>
            <p className="flex items-start gap-2 text-slate-600"><MapPin className="mt-0.5 size-4 shrink-0 text-electric" /> {intervention.address}</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <a href={mapsUrl(intervention.address)} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-50 text-sm font-semibold text-navy ring-1 ring-line">
              <Navigation className="size-4 text-electric" /> Itinéraire
            </a>
            <a href={`tel:${client?.phone.replace(/\s/g, "")}`} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-50 text-sm font-semibold text-navy ring-1 ring-line">
              <Phone className="size-4 text-electric" /> Appeler
            </a>
          </div>
        </div>

        {status === "PLANIFIEE" && (
          <button
            onClick={() => actions.startIntervention(intervention.id)}
            className="flex h-16 w-full animate-fade-up items-center justify-center gap-2 rounded-2xl bg-brand-gradient text-base font-bold tracking-wide text-white uppercase shadow-glow active:scale-[0.98]"
          >
            <Play className="size-5" /> Commencer
          </button>
        )}

        {(running || status === "TERMINEE") && (
          <>
            <StepCard id="step-checklist" n={1} title="Checklist" icon={<ListChecks className="size-5" />} done={checklistDone}>
              <Checklist intervention={intervention} disabled={!running} large />
            </StepCard>
            <StepCard id="step-photos" n={2} title="Photos" icon={<Camera className="size-5" />} done={intervention.photos.length > 0}>
              <PhotoGallery intervention={intervention} readOnly={!running} columns={2} />
            </StepCard>
            <StepCard id="step-report" n={3} title="Rapport" icon={<FileText className="size-5" />} done={intervention.report.trim().length > 20}>
              <ReportEditor intervention={intervention} disabled={!running} />
            </StepCard>
            <StepCard id="step-signature" n={4} title="Signature" icon={<PenLine className="size-5" />} done={Boolean(intervention.signature)}>
              <SignaturePad intervention={intervention} disabled={!running} large />
            </StepCard>
            {running && (
              <button
                onClick={() => {
                  if (actions.completeIntervention(intervention.id)) {
                    setJustFinished(true);
                    scroller.current?.parentElement?.scrollTo({ top: 0 });
                  }
                }}
                className={cn(
                  "flex h-16 w-full items-center justify-center gap-2 rounded-2xl text-base font-bold tracking-wide text-white uppercase transition active:scale-[0.98]",
                  intervention.signature ? "bg-emerald-600 shadow-[0_12px_28px_-10px_rgb(5_150_105/0.7)]" : "bg-slate-300",
                )}
              >
                <CheckCircle2 className="size-5" /> Terminer
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function PlanningScreen({ techId, onOpen }: { techId: string; onOpen: (id: string) => void }) {
  const { data, today } = useStore();
  const monday = startOfWeek(today);
  const days = Array.from({ length: 5 }, (_, i) => addDays(monday, i));
  return (
    <div className="p-4 pb-8">
      <h1 className="mb-1 font-display text-2xl font-bold text-navy">Mon planning</h1>
      <p className="mb-5 text-sm text-muted">Semaine du {formatDate(monday)}</p>
      <div className="space-y-5">
        {days.map((day) => {
          const list = data.interventions.filter((i) => i.date === day && i.technicianId === techId && i.status !== "ANNULEE").sort(byTime);
          return (
            <div key={day}>
              <p className={cn("mb-2 flex items-center gap-2 px-1 text-sm font-bold", day === today ? "text-electric" : "text-navy")}>
                {formatWeekday(day)} {formatDate(day, "short")}
                {day === today && <span className="rounded-md bg-electric px-1.5 py-0.5 text-[10px] text-white uppercase">Aujourd&apos;hui</span>}
              </p>
              <div className="space-y-2">
                {list.map((i) => <MiniRow key={i.id} intervention={i} onOpen={() => onOpen(i.id)} />)}
                {list.length === 0 && <p className="rounded-2xl border border-dashed border-slate-200 p-3 text-center text-xs text-slate-400">Aucune intervention</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InterventionsScreen({ techId, onOpen }: { techId: string; onOpen: (id: string) => void }) {
  const { data, today } = useStore();
  const [filter, setFilter] = useState<"todo" | "done">("todo");
  const list = data.interventions
    .filter((i) => i.technicianId === techId && i.date && (filter === "todo" ? i.status === "PLANIFIEE" || i.status === "EN_COURS" : i.status === "TERMINEE"))
    .sort(byTime);
  if (filter === "done") list.reverse();
  return (
    <div className="p-4 pb-8">
      <h1 className="mb-4 font-display text-2xl font-bold text-navy">Mes interventions</h1>
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
        {(["todo", "done"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={cn("h-10 rounded-xl text-sm font-semibold transition", filter === f ? "bg-white text-navy shadow-sm" : "text-slate-500")}>
            {f === "todo" ? "À réaliser" : "Terminées"}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {list.map((i) => (
          <button key={i.id} onClick={() => onOpen(i.id)} className="flex w-full items-center gap-3 rounded-2xl bg-white p-3.5 text-left ring-1 ring-line active:bg-slate-50">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-muted">{i.date === today ? "Aujourd'hui" : formatDate(i.date)} · {i.time}</p>
              <p className="truncate text-[15px] font-semibold text-navy">{getClient(data, i.clientId)?.name}</p>
              <p className="truncate text-[13px] text-muted">{i.title}</p>
            </div>
            <StatusBadge status={i.status} size="xs" />
          </button>
        ))}
      </div>
    </div>
  );
}

function ProfileScreen({ techId, onChange }: { techId: string; onChange: (id: string) => void }) {
  const { data } = useStore();
  const tech = data.team.find((m) => m.id === techId)!;
  const name = `${tech.firstName} ${tech.lastName}`;
  return (
    <div className="p-4 pb-8">
      <div className="flex flex-col items-center rounded-3xl bg-white p-6 text-center ring-1 ring-line">
        <Avatar name={name} color={tech.color} size="xl" />
        <p className="mt-3 font-display text-xl font-bold text-navy">{name}</p>
        <p className="text-sm text-muted">{tech.role} · {data.settings.companyName}</p>
        <div className="mt-5 grid w-full grid-cols-3 gap-2">
          {[
            [String(tech.monthInterventions), "ce mois"],
            [tech.satisfaction.toLocaleString("fr-FR"), "satisfaction"],
            [`${tech.onTimeRate} %`, "ponctualité"],
          ].map(([v, l]) => (
            <div key={l} className="rounded-2xl bg-slate-50 p-3">
              <p className="font-display text-lg font-bold text-navy">{v}</p>
              <p className="text-[11px] text-muted">{l}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 rounded-3xl bg-white p-4 ring-1 ring-line">
        <p className="mb-3 text-sm font-bold text-navy">Habilitations</p>
        <div className="flex flex-wrap gap-2">
          {tech.skills.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 rounded-lg bg-electric-50 px-2.5 py-1.5 text-xs font-medium text-electric"><Star className="size-3" />{s}</span>
          ))}
        </div>
      </div>
      <label className="mt-4 block rounded-3xl bg-white p-4 ring-1 ring-line">
        <span className="mb-2 block text-sm font-bold text-navy">Profil de démonstration</span>
        <select
          value={techId}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-full rounded-xl border border-line bg-white px-3 text-sm"
        >
          {data.team.filter((m) => m.appRole === "technicien").map((m) => (
            <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
          ))}
        </select>
        <span className="mt-2 block text-xs text-muted">Dans la version connectée, chaque technicien se connecte avec son propre compte.</span>
      </label>
    </div>
  );
}

/* ——————————————————— Application ——————————————————— */

export function TechnicianApp() {
  const params = useSearchParams();
  const { data } = useStore();
  const [tab, setTab] = useState<Tab>("today");
  const [techId, setTechId] = useState(DEFAULT_TECH);
  const [openId, setOpenId] = useState<string | null>(null);
  const [section, setSection] = useState<Section | undefined>();
  const scroller = useRef<HTMLDivElement>(null);

  // Liens profonds (utilisés par le mode démo) : ?intervention=INT-…&section=checklist
  useEffect(() => {
    const id = params.get("intervention");
    setOpenId(id);
    setSection((params.get("section") as Section) ?? undefined);
    if (!id) setTab("today");
  }, [params]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [tab, openId]);

  const open = (id: string) => {
    setSection(undefined);
    setOpenId(id);
  };

  const nextId = useMemo(() => {
    const mine = data.interventions.filter((i) => i.technicianId === techId && i.status === "PLANIFIEE" && i.date).sort(byTime);
    return mine[0]?.id ?? null;
  }, [data.interventions, techId]);

  return (
    <div className="flex h-full flex-col bg-canvas">
      <div className="flex items-center justify-between bg-navy px-4 py-1.5 text-[10px] text-white/50">
        <span className="font-semibold tracking-[0.2em] text-white/80">E-DUST <span className="text-cyan-brand">INTERVENTION</span></span>
        <span>{BRAND.demoNotice}</span>
      </div>

      <div ref={scroller} className="scrollbar-thin relative flex-1 overflow-y-auto overscroll-contain">
        {openId ? (
          <InterventionScreen
            key={openId}
            id={openId}
            section={section}
            onBack={() => setOpenId(null)}
            onNext={() => (nextId ? open(nextId) : setOpenId(null))}
          />
        ) : (
          <div key={tab} className="animate-fade-in">
            {tab === "today" && <TodayScreen techId={techId} onOpen={open} />}
            {tab === "planning" && <PlanningScreen techId={techId} onOpen={open} />}
            {tab === "interventions" && <InterventionsScreen techId={techId} onOpen={open} />}
            {tab === "profile" && <ProfileScreen techId={techId} onChange={setTechId} />}
          </div>
        )}
      </div>

      <nav className="grid grid-cols-4 border-t border-line bg-white pb-[env(safe-area-inset-bottom)]" aria-label="Navigation technicien">
        {TABS.map(({ value, label, icon: Icon }) => {
          const active = tab === value && !openId;
          return (
            <button
              key={value}
              onClick={() => {
                setOpenId(null);
                setTab(value);
              }}
              className={cn("flex h-16 flex-col items-center justify-center gap-1 text-[10.5px] font-semibold tracking-wide uppercase transition", active ? "text-electric" : "text-slate-400")}
              aria-current={active ? "page" : undefined}
            >
              <span className={cn("grid h-7 w-12 place-items-center rounded-full transition", active && "bg-electric-50")}>
                <Icon className="size-5" />
              </span>
              {label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
