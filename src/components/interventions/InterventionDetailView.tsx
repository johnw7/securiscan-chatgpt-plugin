"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  ArrowLeft, Ban, Building2, CalendarCheck, CalendarDays, Camera, CheckCircle2, ClipboardCheck, Clock3, FileText,
  Flag, MapPin, Navigation, PenLine, Phone, Play, Printer, Timer, User, Wrench,
} from "lucide-react";
import { useStore } from "@/lib/store/AppStore";
import { useAppActions } from "@/lib/store/useAppActions";
import { getClient, getMember, memberName } from "@/lib/store/selectors";
import { formatDate, formatDuration } from "@/lib/dates";
import { formatCurrency } from "@/lib/format";
import { mapsUrl } from "@/lib/utils";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button, ButtonLink, buttonClasses } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { PriorityBadge, StatusBadge, TypeTag } from "./Badges";
import { Checklist } from "./Checklist";
import { InterventionTimeline } from "./Timeline";
import { PhotoGallery } from "./PhotoGallery";
import { ReportEditor } from "./ReportEditor";
import { SignaturePad } from "./SignaturePad";
import { ScheduleModal } from "./ScheduleModal";

function Info({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-500">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium tracking-wide text-muted uppercase">{label}</p>
        <div className="text-sm font-semibold text-navy">{children}</div>
      </div>
    </div>
  );
}

export function InterventionDetailView({ id }: { id: string }) {
  const { data } = useStore();
  const actions = useAppActions();
  const [scheduling, setScheduling] = useState(false);
  const intervention = data.interventions.find((i) => i.id === id);

  if (!intervention) {
    return (
      <Card>
        <EmptyState
          icon={<Wrench className="size-6" />}
          title="Intervention introuvable"
          text={`Aucune intervention ne correspond à la référence ${id}.`}
          action={<Link href="/interventions" className={buttonClasses("secondary")}>Retour aux interventions</Link>}
        />
      </Card>
    );
  }

  const client = getClient(data, intervention.clientId);
  const tech = getMember(data, intervention.technicianId);
  const status = intervention.status;
  const running = status === "EN_COURS";
  const done = status === "TERMINEE";
  const locked = !running;
  const checklistDone = intervention.checklist.every((c) => c.done);

  return (
    <>
      <Link href="/interventions" className="mb-4 inline-flex animate-fade-in items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-electric">
        <ArrowLeft className="size-4" /> Interventions
      </Link>

      <Card className="mb-6 animate-fade-up p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="tabular rounded-lg bg-navy px-2.5 py-1 text-xs font-bold tracking-wider text-white">{intervention.id}</span>
              <TypeTag type={intervention.type} />
            </div>
            <h1 className="mt-3 text-2xl font-bold text-navy sm:text-[28px]">{intervention.title}</h1>
            <Link href={`/clients/${intervention.clientId}`} className="mt-1 inline-flex items-center gap-1.5 text-[15px] font-medium text-slate-600 hover:text-electric">
              <Building2 className="size-4" /> {client?.name}
            </Link>
          </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold tracking-wider text-muted uppercase">Statut</span>
              <StatusBadge status={status} size="md" />
            </div>
            <div className="flex flex-wrap gap-2">
              {status === "A_PLANIFIER" && (
                <Button icon={<CalendarCheck className="size-4" />} onClick={() => setScheduling(true)}>Planifier</Button>
              )}
              {status === "PLANIFIEE" && (
                <Button icon={<Play className="size-4" />} onClick={() => actions.startIntervention(intervention.id)}>Démarrer l&apos;intervention</Button>
              )}
              {(status === "PLANIFIEE" || status === "A_PLANIFIER") && (
                <Button variant="ghost" icon={<Ban className="size-4" />} onClick={() => actions.cancelIntervention(intervention.id)}>Annuler</Button>
              )}
              {done && (
                <ButtonLink href={`/rapport/${intervention.id}`} target="_blank" variant="secondary" icon={<Printer className="size-4" />}>
                  Rapport PDF
                </ButtonLink>
              )}
            </div>
          </div>
        </div>

        {done && (
          <div className="mt-5 flex animate-scale-in items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-800">
            <CheckCircle2 className="size-5 shrink-0" />
            <span>
              <strong>Intervention terminée.</strong> Rapport signé{intervention.signature ? ` par ${intervention.signature.signedBy}` : ""} et transmis au client.
            </span>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-5 border-t border-line pt-6 sm:grid-cols-2 xl:grid-cols-4">
          <Info icon={<Building2 className="size-4" />} label="Client">
            <Link href={`/clients/${intervention.clientId}`} className="hover:text-electric">{client?.name}</Link>
          </Info>
          <Info icon={<MapPin className="size-4" />} label="Adresse">
            <a href={mapsUrl(intervention.address)} target="_blank" rel="noreferrer" className="hover:text-electric">{intervention.address}</a>
          </Info>
          <Info icon={<CalendarDays className="size-4" />} label="Date">{intervention.date ? formatDate(intervention.date, "long") : "À planifier"}</Info>
          <Info icon={<Clock3 className="size-4" />} label="Heure">{intervention.time ?? "—"}</Info>
          <Info icon={<User className="size-4" />} label="Technicien">
            <span className="flex items-center gap-2">
              <Avatar name={memberName(tech)} color={tech?.color} size="xs" /> {memberName(tech)}
            </span>
          </Info>
          <Info icon={<Flag className="size-4" />} label="Priorité"><PriorityBadge priority={intervention.priority} size="xs" /></Info>
          <Info icon={<Timer className="size-4" />} label="Durée prévue">{formatDuration(intervention.durationMin)}</Info>
          <Info icon={<FileText className="size-4" />} label="Montant estimé HT">{intervention.amount ? formatCurrency(intervention.amount) : "—"}</Info>
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4">
          <p className="text-[11px] font-semibold tracking-wider text-muted uppercase">Description</p>
          <p className="mt-1.5 text-[15px] leading-relaxed text-slate-700">« {intervention.description} »</p>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {locked && !done && status !== "ANNULEE" && (
            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-electric/30 bg-electric-50/50 px-4 py-3 text-sm text-navy">
              <Play className="size-4 shrink-0 text-electric" />
              Démarrez l&apos;intervention pour compléter la checklist, les photos, le rapport et la signature.
            </div>
          )}

          <Card>
            <CardHeader title="Checklist technicien" icon={<ClipboardCheck className="size-[18px]" />} subtitle="Étapes obligatoires de l'intervention" />
            <div className="px-5 pb-5"><Checklist intervention={intervention} disabled={locked} /></div>
          </Card>

          <Card>
            <CardHeader title="Photos de l'intervention" icon={<Camera className="size-[18px]" />} subtitle={`${intervention.photos.length} photo${intervention.photos.length > 1 ? "s" : ""}`} />
            <div className="px-5 pb-5"><PhotoGallery intervention={intervention} readOnly={locked} /></div>
          </Card>

          <Card>
            <CardHeader title="Rapport d'intervention" icon={<FileText className="size-[18px]" />} />
            <div className="px-5 pb-5"><ReportEditor intervention={intervention} disabled={locked} /></div>
          </Card>

          <Card>
            <CardHeader title="Signature du client" icon={<PenLine className="size-[18px]" />} subtitle="Valide le rapport d'intervention" />
            <div className="px-5 pb-5">
              <SignaturePad intervention={intervention} disabled={locked} />
              {running && (
                <div className="mt-5 border-t border-line pt-5">
                  {!checklistDone && <p className="mb-3 text-xs text-amber-700">Astuce : la checklist n&apos;est pas entièrement cochée.</p>}
                  <Button
                    variant="success"
                    size="lg"
                    className="w-full tracking-wide uppercase"
                    icon={<CheckCircle2 className="size-5" />}
                    onClick={() => actions.completeIntervention(intervention.id)}
                  >
                    Terminer l&apos;intervention
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Suivi en temps réel" subtitle="Chronologie de l'intervention" />
            <div className="px-5 pb-5"><InterventionTimeline events={intervention.timeline} /></div>
          </Card>
          {client && (
            <Card>
              <CardHeader title="Contact sur site" />
              <div className="space-y-4 px-5 pb-5">
                <div className="flex items-center gap-3">
                  <Avatar name={client.contactName} />
                  <div>
                    <p className="text-sm font-semibold text-navy">{client.contactName}</p>
                    <p className="text-xs text-muted">{client.contactRole}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <a href={`tel:${client.phone.replace(/\s/g, "")}`} className={buttonClasses("secondary", "sm")}>
                    <Phone className="size-3.5" /> Appeler
                  </a>
                  <a href={mapsUrl(intervention.address)} target="_blank" rel="noreferrer" className={buttonClasses("secondary", "sm")}>
                    <Navigation className="size-3.5" /> Itinéraire
                  </a>
                </div>
                {client.notes && <p className="rounded-xl bg-amber-50/70 p-3 text-xs leading-relaxed text-amber-900">{client.notes}</p>}
              </div>
            </Card>
          )}
        </div>
      </div>

      <ScheduleModal intervention={scheduling ? intervention : null} onClose={() => setScheduling(false)} />
    </>
  );
}
