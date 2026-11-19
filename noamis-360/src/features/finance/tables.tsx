"use client";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { INVOICE_STATUS, QUOTE_STATUS, optionsOf } from "@/lib/labels";
import { formatDate, formatEUR } from "@/lib/utils";

export type QuoteRow = { id: string; number: string; title: string; client: string; status: string; issue_date: string; valid_until: string | null; total_ttc: number };
export function QuotesTable({ rows }: { rows: QuoteRow[] }) {
  return (
    <DataTable
      caption="Devis"
      rows={rows}
      searchText={(r) => `${r.number} ${r.title} ${r.client}`}
      onRowHref={(r) => `/finance/quotes/${r.id}`}
      emptyTitle="Aucun devis"
      filters={[{ key: "s", label: "Statut", options: optionsOf(QUOTE_STATUS), predicate: (r, v) => r.status === v }]}
      columns={[
        { key: "n", header: "Numéro", sortValue: (r) => r.number, cell: (r) => <Link href={`/finance/quotes/${r.id}`} className="font-mono text-xs text-gold-text">{r.number}</Link> },
        { key: "t", header: "Objet", cell: (r) => r.title, sortValue: (r) => r.title },
        { key: "c", header: "Client", cell: (r) => r.client, sortValue: (r) => r.client, hideOnMobile: true },
        { key: "d", header: "Date", cell: (r) => formatDate(r.issue_date), sortValue: (r) => r.issue_date, hideOnMobile: true },
        { key: "v", header: "Validité", cell: (r) => formatDate(r.valid_until), hideOnMobile: true },
        { key: "a", header: "TTC", cell: (r) => formatEUR(r.total_ttc), sortValue: (r) => r.total_ttc, className: "text-right tabular-nums" },
        { key: "s", header: "Statut", cell: (r) => <StatusBadge map={QUOTE_STATUS} value={r.status} /> },
      ]}
    />
  );
}

export type InvoiceRow = { id: string; number: string | null; kind: string; title: string; client: string; status: string; issue_date: string | null; due_date: string | null; total_ttc: number; due: number; overdue: boolean };
export function InvoicesTable({ rows }: { rows: InvoiceRow[] }) {
  return (
    <DataTable
      caption="Factures et avoirs"
      rows={rows}
      searchText={(r) => `${r.number ?? ""} ${r.title} ${r.client}`}
      onRowHref={(r) => `/finance/invoices/${r.id}`}
      emptyTitle="Aucune facture"
      filters={[
        { key: "s", label: "Statut", options: optionsOf(INVOICE_STATUS), predicate: (r, v) => r.status === v },
        { key: "k", label: "Type", options: [{ value: "facture", label: "Factures" }, { value: "avoir", label: "Avoirs" }], predicate: (r, v) => r.kind === v },
        { key: "o", label: "Échéance", options: [{ value: "late", label: "En retard" }], predicate: (r) => r.overdue },
      ]}
      columns={[
        { key: "n", header: "Numéro", sortValue: (r) => r.number ?? "", cell: (r) => <Link href={`/finance/invoices/${r.id}`} className="font-mono text-xs text-gold-text">{r.number ?? "Brouillon"}{r.kind === "avoir" ? " (avoir)" : ""}</Link> },
        { key: "t", header: "Objet", cell: (r) => r.title },
        { key: "c", header: "Client", cell: (r) => r.client, sortValue: (r) => r.client, hideOnMobile: true },
        { key: "d", header: "Émise le", cell: (r) => formatDate(r.issue_date), sortValue: (r) => r.issue_date, hideOnMobile: true },
        { key: "e", header: "Échéance", cell: (r) => <span className={r.overdue ? "font-medium text-danger" : ""}>{formatDate(r.due_date)}</span>, sortValue: (r) => r.due_date, hideOnMobile: true },
        { key: "a", header: "TTC", cell: (r) => formatEUR(r.total_ttc), sortValue: (r) => r.total_ttc, className: "text-right tabular-nums" },
        { key: "r", header: "Reste dû", cell: (r) => formatEUR(r.due), sortValue: (r) => r.due, className: "text-right tabular-nums", hideOnMobile: true },
        { key: "s", header: "Statut", cell: (r) => <StatusBadge map={INVOICE_STATUS} value={r.status} /> },
      ]}
    />
  );
}
