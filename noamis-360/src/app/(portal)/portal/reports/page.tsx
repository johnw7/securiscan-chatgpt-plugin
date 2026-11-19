import type { Metadata } from "next";
import { FileDown, Newspaper, ShieldCheck } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { requireClient } from "@/lib/auth/session";
import { RECO_HORIZON, RECO_PRIORITY, RECO_STATUS, REPORT_KINDS, SEVERITY, labelOf } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Suivi et veille" };

export default async function PortalReports() {
  await requireClient();
  const supabase = await createClient();
  const [{ data: reports }, { data: recos }] = await Promise.all([
    supabase.from("intelligence_reports").select("id, kind, title, summary, severity, published_at").order("published_at", { ascending: false }),
    supabase.from("recommendations").select("id, title, priority, horizon, status, due_date, audits(reference, title)").order("priority"),
  ]);
  return (
    <>
      <PageHeader eyebrow="NOAMIS CONNECT" title="Suivi et veille" description="Plan d'actions issu de vos audits validés et analyses de veille qui vous sont adressées." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Mesures recommandées" description="Suivi de la mise en œuvre (mis à jour par votre consultant)." />
          <CardBody className="p-0">
            {recos?.length ? (
              <ul className="divide-y divide-border">
                {recos.map((r) => (
                  <li key={r.id} className="space-y-1 px-5 py-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge map={RECO_PRIORITY} value={r.priority} />
                      <span className="flex-1 font-medium">{r.title}</span>
                      <StatusBadge map={RECO_STATUS} value={r.status} />
                    </div>
                    <p className="text-xs text-muted">{(r.audits as { reference: string } | null)?.reference} · {labelOf(RECO_HORIZON, r.horizon)}{r.due_date ? ` · échéance ${formatDate(r.due_date)}` : ""}</p>
                  </li>
                ))}
              </ul>
            ) : <div className="p-5"><EmptyState icon={ShieldCheck} title="Aucune recommandation partagée" /></div>}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Veille et alertes" />
          <CardBody className="p-0">
            {reports?.length ? (
              <ul className="divide-y divide-border">
                {reports.map((r) => (
                  <li key={r.id} className="space-y-1 px-5 py-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge map={REPORT_KINDS} value={r.kind} />
                      {r.severity && <StatusBadge map={SEVERITY} value={r.severity} />}
                      <span className="flex-1 font-medium">{r.title}</span>
                      <a href={`/api/pdf/intelligence/${r.id}`} className="inline-flex items-center gap-1 text-gold-text hover:underline"><FileDown className="size-4" /> PDF</a>
                    </div>
                    {r.summary && <p className="text-muted">{r.summary}</p>}
                    <p className="text-xs text-muted">Diffusé le {formatDate(r.published_at)}</p>
                  </li>
                ))}
              </ul>
            ) : <div className="p-5"><EmptyState icon={Newspaper} title="Aucune analyse diffusée" /></div>}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
