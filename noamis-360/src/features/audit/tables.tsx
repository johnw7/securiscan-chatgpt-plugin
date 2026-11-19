"use client";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { AUDIT_STATUS, optionsOf } from "@/lib/labels";
import { formatDate } from "@/lib/utils";

export type AuditRow = { id: string; reference: string; title: string; status: string; audit_date: string | null; site_name: string | null; client: string; auditor: string | null; risks: number };

export function AuditsTable({ rows }: { rows: AuditRow[] }) {
  return (
    <DataTable
      caption="Liste des audits"
      rows={rows}
      searchText={(r) => `${r.reference} ${r.title} ${r.client} ${r.site_name ?? ""}`}
      searchPlaceholder="Rechercher un audit…"
      onRowHref={(r) => `/audit/${r.id}`}
      emptyTitle="Aucun audit"
      filters={[{ key: "status", label: "Statut", options: optionsOf(AUDIT_STATUS), predicate: (r, v) => r.status === v }]}
      columns={[
        { key: "ref", header: "Réf.", sortValue: (r) => r.reference, cell: (r) => <span className="font-mono text-xs text-gold-text">{r.reference}</span> },
        { key: "title", header: "Audit", sortValue: (r) => r.title, cell: (r) => <Link href={`/audit/${r.id}`} className="font-medium hover:text-gold-text">{r.title}</Link> },
        { key: "client", header: "Client", cell: (r) => r.client, sortValue: (r) => r.client, hideOnMobile: true },
        { key: "date", header: "Visite", cell: (r) => formatDate(r.audit_date), sortValue: (r) => r.audit_date, hideOnMobile: true },
        { key: "auditor", header: "Consultant", cell: (r) => r.auditor ?? "—", hideOnMobile: true },
        { key: "risks", header: "Risques", cell: (r) => r.risks, className: "text-right tabular-nums", hideOnMobile: true },
        { key: "status", header: "Statut", cell: (r) => <StatusBadge map={AUDIT_STATUS} value={r.status} /> },
      ]}
    />
  );
}
