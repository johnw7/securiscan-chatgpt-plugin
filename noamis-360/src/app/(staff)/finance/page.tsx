import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, FileSpreadsheet, FileText, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { MonthlyBarChart } from "@/components/charts/charts";
import { Notice, PageHeader, StatCard } from "@/components/ui/misc";
import { amountDue, isOverdue, sum } from "@/features/finance/calc";
import { requireCapability } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { formatEUR, todayISO } from "@/lib/utils";

export const metadata: Metadata = { title: "Finance" };

const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

export default async function FinancePage() {
  const session = await requireCapability("finance.view");
  const supabase = await createClient();
  const today = todayISO();
  const year = today.slice(0, 4);
  const [{ data: invoices }, { data: quotes }, { data: payments }] = await Promise.all([
    supabase.from("invoices").select("id, kind, status, total_ht, total_ttc, amount_paid, amount_credited, due_date, issue_date").neq("status", "brouillon").is("deleted_at", null),
    supabase.from("quotes").select("id, status, total_ht").is("deleted_at", null),
    supabase.from("payments").select("amount, paid_at").gte("paid_at", `${year}-01-01`),
  ]);
  const inv = invoices ?? [];
  const open = inv.filter((i) => i.kind === "facture" && ["emise", "partiellement_payee"].includes(i.status));
  const aging = [
    { label: "Non échu", f: (d: number) => d <= 0 },
    { label: "1 à 30 jours", f: (d: number) => d > 0 && d <= 30 },
    { label: "31 à 60 jours", f: (d: number) => d > 30 && d <= 60 },
    { label: "Plus de 60 jours", f: (d: number) => d > 60 },
  ].map((b) => {
    const rows = open.filter((i) => b.f(i.due_date ? Math.floor((Date.parse(today) - Date.parse(i.due_date)) / 86400000) : 0));
    return { label: b.label, count: rows.length, amount: sum(rows.map((i) => amountDue(i))) };
  });
  const cash = MONTHS.map((month, idx) => ({ month, value: sum((payments ?? []).filter((p) => Number(p.paid_at.slice(5, 7)) === idx + 1).map((p) => p.amount)) }));
  const q = quotes ?? [];
  const decided = q.filter((x) => ["accepte", "refuse", "converti"].includes(x.status));

  return (
    <>
      <PageHeader
        eyebrow="NOAMIS FINANCE"
        title="Commercial et financier"
        description="Catalogue, devis, factures, avoirs, règlements, relances et export comptable."
        actions={
          <>
            <Button asChild variant="secondary"><Link href="/finance/catalog"><BookOpen /> Catalogue</Link></Button>
            <Button asChild variant="secondary"><Link href="/finance/quotes"><FileText /> Devis</Link></Button>
            <Button asChild><Link href="/finance/invoices"><Receipt /> Factures</Link></Button>
          </>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={`Facturé HT ${year}`} value={formatEUR(sum(inv.filter((i) => i.issue_date?.startsWith(year)).map((i) => i.total_ht)))} tone="success" />
        <StatCard label="Reste à encaisser" value={formatEUR(sum(open.map((i) => amountDue(i))))} hint={`${open.length} facture(s) ouverte(s)`} />
        <StatCard label="En retard" value={formatEUR(sum(open.filter((i) => isOverdue(i, today)).map((i) => amountDue(i))))} tone="danger" hint={`${open.filter((i) => isOverdue(i, today)).length} facture(s)`} />
        <StatCard label="Devis en attente" value={formatEUR(sum(q.filter((x) => x.status === "envoye").map((x) => x.total_ht)))} tone="info" hint={`Taux d'acceptation : ${decided.length ? Math.round((q.filter((x) => ["accepte", "converti"].includes(x.status)).length / decided.length) * 100) : 0} %`} />
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Encaissements" description={`Règlements reçus par mois, ${year}`} />
          <CardBody><MonthlyBarChart data={cash} label="Encaissements" /></CardBody>
        </Card>
        <Card>
          <CardHeader title="Balance âgée" description="Créances clients par ancienneté" />
          <CardBody>
            <ul className="space-y-3 text-sm">
              {aging.map((a) => (
                <li key={a.label} className="flex items-center justify-between gap-2">
                  <span className="text-muted">{a.label} <span className="text-xs">({a.count})</span></span>
                  <span className="tabular-nums">{formatEUR(a.amount)}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>
      {can(session.role, "finance.export") && (
        <Card className="mt-6">
          <CardHeader title="Export comptable" description="Journal des ventes (structure FEC) des factures et avoirs émis, à transmettre à l'expert-comptable." />
          <CardBody>
            <form action="/api/finance/export" method="get" className="flex flex-wrap items-end gap-3">
              <label className="text-sm">Du<input type="date" name="from" defaultValue={`${year}-01-01`} required className="ml-2 h-10 rounded-lg border border-border bg-surface-2 px-3" /></label>
              <label className="text-sm">au<input type="date" name="to" defaultValue={today} required className="ml-2 h-10 rounded-lg border border-border bg-surface-2 px-3" /></label>
              <Button type="submit" variant="outline"><FileSpreadsheet /> Exporter (CSV)</Button>
            </form>
          </CardBody>
        </Card>
      )}
      <div className="mt-6">
        <Notice tone="warning" title="Facturation électronique (réforme 2026-2027)">
          Les factures PDF produites par NOAMIS 360° comportent les mentions obligatoires mais ne constituent pas, à elles seules, des factures électroniques
          réglementaires. La réception de factures électroniques via une plateforme agréée (PA) s&apos;applique depuis le 1er septembre 2026 ; l&apos;émission sera
          obligatoire pour les micro-entreprises au 1er septembre 2027 (à confirmer sur impots.gouv.fr selon le statut de NOAMIS). Une intégration avec la plateforme
          agréée choisie est prévue (voir docs/DECISIONS.md).
        </Notice>
      </div>
    </>
  );
}
