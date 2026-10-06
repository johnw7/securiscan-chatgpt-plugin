"use client";

import Link from "next/link";
import { Receipt } from "lucide-react";
import type { Invoice } from "@/lib/types";
import { INVOICE_STATUS_META } from "@/lib/constants";
import { formatDate } from "@/lib/dates";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

export function InvoiceList({ invoices }: { invoices: Invoice[] }) {
  if (invoices.length === 0) {
    return <EmptyState icon={<Receipt className="size-6" />} title="Aucune facture" text="Les factures sont générées à la clôture des interventions." />;
  }
  return (
    <ul className="divide-y divide-line">
      {invoices.map((f) => (
        <li key={f.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
            <Receipt className="size-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-navy">{f.id}</p>
            <p className="truncate text-xs text-muted">
              Émise le {formatDate(f.issuedAt)} · échéance {formatDate(f.dueAt)}
              {f.interventionId && (
                <>
                  {" · "}
                  <Link href={`/interventions/${f.interventionId}`} className="text-electric hover:underline">
                    {f.interventionId}
                  </Link>
                </>
              )}
            </p>
          </div>
          <span className="tabular text-sm font-semibold text-navy">{formatCurrency(f.amount)}</span>
          <Badge tone={INVOICE_STATUS_META[f.status].tone} size="xs">{INVOICE_STATUS_META[f.status].label}</Badge>
        </li>
      ))}
    </ul>
  );
}
