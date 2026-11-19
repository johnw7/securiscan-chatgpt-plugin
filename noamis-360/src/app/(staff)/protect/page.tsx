import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DonutChart } from "@/components/charts/charts";
import { EmptyState, Notice, PageHeader, StatCard } from "@/components/ui/misc";
import { AUDIENCES, LEVEL_LABELS } from "@/features/protect/questionnaire";
import { requireCapability } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Diagnostics PROTECT" };

export default async function ProtectAdminPage() {
  await requireCapability("crm.manage");
  const supabase = await createClient();
  const { data } = await supabase.from("protect_assessments").select("id, audience, score, level, department, contact_requested, lead_id, created_at").order("created_at", { ascending: false }).limit(500);
  const rows = data ?? [];
  const avg = rows.length ? Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length) : 0;
  return (
    <>
      <PageHeader
        eyebrow="NOAMIS PROTECT"
        title="Diagnostics préliminaires"
        description="Auto-évaluations réalisées sur la page publique. Les demandes de contact (avec consentement) créent automatiquement un prospect."
        actions={<Button asChild variant="outline"><a href="/diagnostic" target="_blank" rel="noopener">Page publique <ExternalLink /></a></Button>}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Diagnostics" value={rows.length} />
        <StatCard label="Demandes de contact" value={rows.filter((r) => r.contact_requested).length} tone="success" hint={rows.length ? `${Math.round((rows.filter((r) => r.contact_requested).length / rows.length) * 100)} % de conversion` : undefined} />
        <StatCard label="Score moyen" value={`${avg} / 100`} tone="info" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Répartition par profil" />
          <CardBody>{rows.length ? <DonutChart label="Profils" data={Object.entries(AUDIENCES).map(([k, v]) => ({ name: v.label, value: rows.filter((r) => r.audience === k).length }))} /> : <EmptyState title="Aucun diagnostic" />}</CardBody>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="Derniers diagnostics" />
          <CardBody className="p-0">
            {rows.length ? (
              <ul className="divide-y divide-border">
                {rows.slice(0, 30).map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-2.5 text-sm">
                    <span className="w-36 text-muted">{formatDateTime(r.created_at)}</span>
                    <span className="flex-1">{AUDIENCES[r.audience as keyof typeof AUDIENCES]?.label}{r.department ? ` · dép. ${r.department}` : ""}</span>
                    <Badge tone={r.level === "a_renforcer" ? "danger" : r.level === "intermediaire" ? "warning" : "success"}>{r.score} — {LEVEL_LABELS[r.level as keyof typeof LEVEL_LABELS]}</Badge>
                    {r.lead_id ? <Link href="/pilot/leads" className="text-gold-text hover:underline">Prospect</Link> : <span className="text-xs text-muted">anonyme</span>}
                  </li>
                ))}
              </ul>
            ) : <div className="p-5"><EmptyState title="Aucun diagnostic" /></div>}
          </CardBody>
        </Card>
      </div>
      <div className="mt-6"><Notice tone="info">Conservation : les diagnostics anonymes de plus de 12 mois sont purgés (fonction purge_protect_assessments, voir docs/OPERATIONS.md).</Notice></div>
    </>
  );
}
