import type { Metadata } from "next";
import { FileDown } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { respondQuote } from "@/features/connect/actions";
import { RespondButtons } from "@/features/connect/respond";
import { amountDue } from "@/features/finance/calc";
import { requireClient } from "@/lib/auth/session";
import { INVOICE_STATUS, QUOTE_STATUS } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatEUR, todayISO } from "@/lib/utils";

export const metadata: Metadata = { title: "Devis et factures" };

export default async function PortalFinance() {
  await requireClient();
  const supabase = await createClient();
  const [{ data: quotes }, { data: invoices }] = await Promise.all([
    supabase.from("quotes").select("id, number, title, status, issue_date, valid_until, total_ttc").order("issue_date", { ascending: false }),
    supabase.from("invoices").select("id, number, kind, title, status, issue_date, due_date, total_ttc, amount_paid, amount_credited").order("issue_date", { ascending: false }),
  ]);
  const today = todayISO();
  return (
    <>
      <PageHeader eyebrow="NOAMIS CONNECT" title="Devis et factures" description="Consultez vos devis, acceptez-les en ligne et téléchargez vos factures." />
      <div className="space-y-6">
        <Card>
          <CardHeader title="Devis" />
          <CardBody className="p-0">
            {quotes?.length ? (
              <ul className="divide-y divide-border">
                {quotes.map((q) => (
                  <li key={q.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{q.number} — {q.title}</p>
                      <p className="text-xs text-muted">Émis le {formatDate(q.issue_date)} · valable jusqu&apos;au {formatDate(q.valid_until)}</p>
                    </div>
                    <span className="tabular-nums">{formatEUR(q.total_ttc)}</span>
                    <StatusBadge map={QUOTE_STATUS} value={q.status} />
                    <a href={`/api/pdf/quote/${q.id}`} className="inline-flex items-center gap-1 text-gold-text hover:underline"><FileDown className="size-4" /> PDF</a>
                    {q.status === "envoye" && (!q.valid_until || q.valid_until >= today) && <RespondButtons subject={`${q.number} — ${q.title}`} action={respondQuote.bind(null, q.id)} />}
                  </li>
                ))}
              </ul>
            ) : <div className="p-5"><EmptyState title="Aucun devis" /></div>}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Factures et avoirs" />
          <CardBody className="p-0">
            {invoices?.length ? (
              <ul className="divide-y divide-border">
                {invoices.map((i) => (
                  <li key={i.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{i.kind === "avoir" ? "Avoir" : "Facture"} {i.number} — {i.title}</p>
                      <p className="text-xs text-muted">Émise le {formatDate(i.issue_date)}{i.kind === "facture" ? ` · échéance ${formatDate(i.due_date)}` : ""}</p>
                    </div>
                    <span className="tabular-nums">{formatEUR(i.total_ttc)}</span>
                    {i.kind === "facture" && Number(amountDue(i)) > 0 && <span className="text-xs text-warning">Reste dû {formatEUR(amountDue(i))}</span>}
                    <StatusBadge map={INVOICE_STATUS} value={i.status} />
                    <a href={`/api/pdf/invoice/${i.id}`} className="inline-flex items-center gap-1 text-gold-text hover:underline"><FileDown className="size-4" /> PDF</a>
                  </li>
                ))}
              </ul>
            ) : <div className="p-5"><EmptyState title="Aucune facture" /></div>}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
