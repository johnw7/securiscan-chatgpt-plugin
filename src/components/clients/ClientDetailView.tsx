"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Building2, CalendarClock, Euro, FileSpreadsheet, Mail, MapPin, Phone, Plus, StickyNote, User, Wrench } from "lucide-react";
import { useStore } from "@/lib/store/AppStore";
import { byTime, clientInterventionCount, getClient } from "@/lib/store/selectors";
import { formatDate, fromISODate } from "@/lib/dates";
import { formatCurrency } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { InterventionRows } from "@/components/interventions/InterventionRows";
import { InterventionForm } from "@/components/interventions/InterventionForm";
import { QuoteList } from "@/components/quotes/QuoteList";
import { InvoiceList } from "@/components/quotes/InvoiceList";
import { DocumentList } from "@/components/documents/DocumentList";
import { ActivityIcon } from "@/components/layout/ActivityIcon";
import type { ActivityKind, ISODate } from "@/lib/types";

type Tab = "overview" | "interventions" | "quotes" | "documents" | "invoices";

interface HistoryItem {
  date: ISODate;
  kind: ActivityKind;
  text: string;
  href?: string;
}

export function ClientDetailView({ id }: { id: string }) {
  const { data, today } = useStore();
  const [tab, setTab] = useState<Tab>("overview");
  const [creating, setCreating] = useState(false);
  const client = getClient(data, id);

  if (!client) {
    return (
      <Card>
        <EmptyState
          icon={<Building2 className="size-6" />}
          title="Client introuvable"
          text="Ce client n'existe pas ou a été supprimé."
          action={<Link href="/clients" className={buttonClasses("secondary")}>Retour aux clients</Link>}
        />
      </Card>
    );
  }

  const interventions = data.interventions.filter((i) => i.clientId === id).sort(byTime).reverse();
  const quotes = data.quotes.filter((q) => q.clientId === id).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  const invoices = data.invoices.filter((f) => f.clientId === id).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  const documents = data.documents.filter((d) => d.clientId === id);
  const upcoming = interventions.filter((i) => i.status === "PLANIFIEE" || i.status === "EN_COURS" || i.status === "A_PLANIFIER").reverse();
  const count = clientInterventionCount(data, id);

  const history: HistoryItem[] = [
    ...interventions
      .filter((i) => i.date && i.date <= today && i.status !== "ANNULEE")
      .map((i) => ({
        date: i.date!,
        kind: (i.status === "TERMINEE" ? "intervention_done" : "intervention_started") as ActivityKind,
        text: `${i.title} — ${i.status === "TERMINEE" ? "terminée" : "en cours"} (${i.id})`,
        href: `/interventions/${i.id}`,
      })),
    ...quotes.map((q) => ({
      date: q.issuedAt,
      kind: (q.status === "REFUSE" ? "quote_refused" : "quote_accepted") as ActivityKind,
      text: `Devis ${q.id} ${q.status === "ACCEPTE" ? "accepté" : q.status === "REFUSE" ? "refusé" : "envoyé"} — ${formatCurrency(q.amount)}`,
    })),
    { date: client.clientSince, kind: "client_new" as ActivityKind, text: "Création de la fiche client" },
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  const tabs: { value: Tab; label: string; count?: number }[] = [
    { value: "overview", label: "Vue générale" },
    { value: "interventions", label: "Interventions", count: interventions.length },
    { value: "quotes", label: "Devis", count: quotes.length },
    { value: "documents", label: "Documents", count: documents.length },
    { value: "invoices", label: "Factures", count: invoices.length },
  ];

  return (
    <>
      <Link href="/clients" className="mb-4 inline-flex animate-fade-in items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-electric">
        <ArrowLeft className="size-4" /> Clients
      </Link>

      <Card className="relative mb-6 animate-fade-up overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-24 bg-navy">
          <div className="absolute inset-0 bg-brand-gradient opacity-60" />
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,.18) 1px, transparent 0)", backgroundSize: "22px 22px" }} />
        </div>
        <div className="relative px-5 pt-12 pb-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
              <span className="grid size-20 shrink-0 place-items-center rounded-2xl bg-white text-electric shadow-card-hover ring-4 ring-white">
                <Building2 className="size-9" />
              </span>
              <div className="min-w-0 pb-1">
                <h1 className="text-2xl font-bold text-navy sm:truncate">{client.name}</h1>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-muted">
                  Client depuis {fromISODate(client.clientSince).getFullYear()}
                  <Badge tone="blue" size="xs" dot={false}>{client.sector}</Badge>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={`tel:${client.phone.replace(/\s/g, "")}`} className={buttonClasses("secondary", "md")}>
                <Phone className="size-4" /> Appeler
              </a>
              <a href={`mailto:${client.email}`} className={buttonClasses("secondary", "md")}>
                <Mail className="size-4" /> E-mail
              </a>
              <Button icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>
                Nouvelle intervention
              </Button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { icon: Wrench, value: count, label: "interventions", format: undefined },
              { icon: FileSpreadsheet, value: quotes.length, label: "devis", format: undefined },
              { icon: Euro, value: client.revenue, label: "de CA", format: (v: number) => formatCurrency(v) },
            ].map(({ icon: Icon, value, label, format }) => (
              <div key={label} className="rounded-2xl border border-line bg-slate-50/60 p-3 sm:p-4">
                <Icon className="size-4 text-electric" />
                <p className="mt-2 font-display text-xl font-bold text-navy sm:text-2xl">
                  <AnimatedNumber value={value} format={format} />
                </p>
                <p className="text-xs text-muted">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Tabs tabs={tabs} value={tab} onChange={setTab} className="mb-6" />

      {tab === "overview" && (
        <div className="grid animate-fade-in grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6">
            <Card>
              <CardHeader title="Coordonnées" icon={<User className="size-[18px]" />} />
              <dl className="space-y-4 px-5 pb-5 text-sm">
                <div>
                  <dt className="text-xs text-muted">Contact principal</dt>
                  <dd className="font-semibold text-navy">{client.contactName}</dd>
                  <dd className="text-xs text-slate-500">{client.contactRole}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Téléphone</dt>
                  <dd><a href={`tel:${client.phone.replace(/\s/g, "")}`} className="tabular font-medium text-navy hover:text-electric">{client.phone}</a></dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Email</dt>
                  <dd><a href={`mailto:${client.email}`} className="font-medium break-all text-navy hover:text-electric">{client.email}</a></dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Adresse</dt>
                  <dd className="flex gap-1.5 font-medium text-navy">
                    <MapPin className="mt-0.5 size-3.5 shrink-0 text-electric" />
                    <span>{client.address}<br />{client.city}</span>
                  </dd>
                </div>
              </dl>
            </Card>
            {client.notes && (
              <Card className="border-amber-200/70 bg-amber-50/40">
                <CardHeader title="Informations d'accès" icon={<StickyNote className="size-[18px]" />} />
                <p className="px-5 pb-5 text-sm leading-relaxed text-slate-700">{client.notes}</p>
              </Card>
            )}
          </div>

          <div className="space-y-6 xl:col-span-2">
            <Card>
              <CardHeader title="Prochaines interventions" icon={<CalendarClock className="size-[18px]" />} subtitle={upcoming.length ? undefined : "Aucune intervention programmée"} />
              {upcoming.length > 0 ? (
                <div className="pb-2"><InterventionRows items={upcoming} showClient={false} /></div>
              ) : (
                <div className="px-5 pb-5">
                  <Button variant="secondary" icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>Planifier une intervention</Button>
                </div>
              )}
            </Card>
            <Card>
              <CardHeader title="Historique du client" subtitle="Interventions, devis et événements" />
              <ol className="px-5 pb-5">
                {history.map((h, idx) => (
                  <li key={idx} className="relative flex gap-3 pb-4 last:pb-0">
                    {idx < history.length - 1 && <span className="absolute top-8 bottom-0 left-[15px] w-px bg-line" />}
                    <ActivityIcon kind={h.kind} />
                    <div className="min-w-0 pt-0.5">
                      {h.href ? (
                        <Link href={h.href} className="text-sm text-ink hover:text-electric">{h.text}</Link>
                      ) : (
                        <p className="text-sm text-ink">{h.text}</p>
                      )}
                      <p className="text-xs text-muted">{formatDate(h.date)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          </div>
        </div>
      )}

      {tab === "interventions" && (
        <Card className="animate-fade-in overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
            <p className="text-sm text-muted">
              {interventions.length} intervention{interventions.length > 1 ? "s" : ""} sur la période · {client.pastInterventions} antérieure{client.pastInterventions > 1 ? "s" : ""} archivée{client.pastInterventions > 1 ? "s" : ""}
            </p>
          </div>
          {interventions.length ? <InterventionRows items={interventions} showClient={false} /> : <EmptyState icon={<Wrench className="size-6" />} title="Aucune intervention" />}
        </Card>
      )}

      {tab === "quotes" && (
        <Card className="animate-fade-in overflow-hidden">
          <QuoteList quotes={quotes} showClient={false} />
        </Card>
      )}

      {tab === "documents" && (
        <Card className="animate-fade-in overflow-hidden">
          <DocumentList documents={documents} showClient={false} />
        </Card>
      )}

      {tab === "invoices" && (
        <Card className="animate-fade-in overflow-hidden">
          <InvoiceList invoices={invoices} />
        </Card>
      )}

      <InterventionForm
        open={creating}
        onClose={() => setCreating(false)}
        prefill={{ clientId: client.id, address: `${client.address}, ${client.city}` }}
      />
    </>
  );
}
