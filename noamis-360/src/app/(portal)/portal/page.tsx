import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, ClipboardCheck, FileText, MessagesSquare, Receipt } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState, PageHeader, Progress, StatCard } from "@/components/ui/misc";
import { amountDue } from "@/features/finance/calc";
import { requireClient } from "@/lib/auth/session";
import { MISSION_STATUS, SERVICE_TYPES, labelOf } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatEUR, todayISO } from "@/lib/utils";

export const metadata: Metadata = { title: "Mon espace" };

export default async function PortalHome() {
  const session = await requireClient();
  const supabase = await createClient();
  const today = todayISO();
  const [{ data: client }, { data: missions }, { data: tasks }, { data: approvals }, { data: quotes }, { data: invoices }, { data: unread }, { data: docs }] = await Promise.all([
    supabase.from("clients").select("name").eq("id", session.clientId).single(),
    supabase.from("missions").select("id, reference, title, service_type, status, progress, end_date").order("created_at", { ascending: false }),
    supabase.from("tasks").select("id, title, due_date, status, mission_id").in("status", ["a_faire", "en_cours"]).gte("due_date", today).order("due_date").limit(6),
    supabase.from("client_approvals").select("id").eq("status", "en_attente"),
    supabase.from("quotes").select("id").eq("status", "envoye"),
    supabase.from("invoices").select("id, kind, status, total_ttc, amount_paid, amount_credited").in("status", ["emise", "partiellement_payee"]),
    supabase.from("messages").select("id").eq("from_client", false).is("read_by_client_at", null),
    supabase.from("documents").select("id, title, updated_at").order("updated_at", { ascending: false }).limit(5),
  ]);
  const due = (invoices ?? []).filter((i) => i.kind === "facture").reduce((s, i) => s + Number(amountDue(i)), 0);
  return (
    <>
      <PageHeader eyebrow="NOAMIS CONNECT" title={`Bienvenue, ${session.fullName.split(" ")[0]}`} description={`Espace sécurisé de ${client?.name ?? "votre organisation"}.`} />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Missions en cours" value={(missions ?? []).filter((m) => ["planifiee", "en_cours", "en_pause"].includes(m.status)).length} icon={Briefcase} />
        <StatCard label="Validations attendues" value={approvals?.length ?? 0} icon={ClipboardCheck} tone={approvals?.length ? "warning" : "gold"} hint={quotes?.length ? `${quotes.length} devis à examiner` : undefined} />
        <StatCard label="Messages non lus" value={unread?.length ?? 0} icon={MessagesSquare} tone="info" />
        <StatCard label="Reste à régler" value={formatEUR(due)} icon={Receipt} tone={due > 0 ? "warning" : "success"} />
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Mes missions" action={<Link className="text-sm text-gold-text hover:underline" href="/portal/missions">Toutes</Link>} />
          <CardBody className="p-0">
            {missions?.length ? (
              <ul className="divide-y divide-border">
                {missions.slice(0, 6).map((m) => (
                  <li key={m.id} className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_180px_auto] sm:items-center">
                    <div className="min-w-0">
                      <Link href={`/portal/missions/${m.id}`} className="font-medium hover:text-gold-text">{m.title}</Link>
                      <p className="text-xs text-muted">{m.reference} · {labelOf(SERVICE_TYPES, m.service_type)} · fin prévue {formatDate(m.end_date)}</p>
                    </div>
                    <Progress value={m.progress} label={`Avancement de ${m.title}`} />
                    <StatusBadge map={MISSION_STATUS} value={m.status} />
                  </li>
                ))}
              </ul>
            ) : <div className="p-5"><EmptyState title="Aucune mission partagée" /></div>}
          </CardBody>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Prochaines échéances" as="h3" />
            <CardBody>
              {tasks?.length ? (
                <ul className="space-y-2 text-sm">{tasks.map((t) => <li key={t.id} className="flex justify-between gap-2"><span className="truncate">{t.title}</span><span className="shrink-0 text-muted">{formatDate(t.due_date)}</span></li>)}</ul>
              ) : <p className="text-sm text-muted">Aucune échéance à venir.</p>}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Documents récents" as="h3" action={<Link className="text-sm text-gold-text hover:underline" href="/portal/documents">Tous</Link>} />
            <CardBody>
              {docs?.length ? (
                <ul className="space-y-2 text-sm">{docs.map((d) => <li key={d.id} className="flex items-center gap-2"><FileText className="size-4 shrink-0 text-gold-text" /><a className="truncate hover:text-gold-text" href={`/api/documents/${d.id}/download`}>{d.title}</a></li>)}</ul>
              ) : <p className="text-sm text-muted">Aucun document partagé.</p>}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
