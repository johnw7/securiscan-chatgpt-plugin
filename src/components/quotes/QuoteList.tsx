"use client";

import { useState } from "react";
import { Check, ChevronRight, FileSpreadsheet, X } from "lucide-react";
import type { Quote } from "@/lib/types";
import { QUOTE_STATUS_META } from "@/lib/constants";
import { useStore } from "@/lib/store/AppStore";
import { useAppActions } from "@/lib/store/useAppActions";
import { getClient } from "@/lib/store/selectors";
import { formatDate } from "@/lib/dates";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, Td, Th, Tr } from "@/components/ui/Table";

export function QuoteList({ quotes, showClient = true }: { quotes: Quote[]; showClient?: boolean }) {
  const { data } = useStore();
  const actions = useAppActions();
  const [openId, setOpenId] = useState<string | null>(null);
  const open = quotes.find((q) => q.id === openId) ?? null;

  if (quotes.length === 0) {
    return <EmptyState icon={<FileSpreadsheet className="size-6" />} title="Aucun devis" text="Aucun devis ne correspond à ces critères." />;
  }

  return (
    <>
      <Table className="hidden sm:block">
        <thead>
          <tr>
            <Th>Référence</Th>
            {showClient && <Th>Client</Th>}
            <Th className="hidden lg:table-cell">Objet</Th>
            <Th className="hidden md:table-cell">Émis le</Th>
            <Th className="text-right">Montant HT</Th>
            <Th>Statut</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((q) => (
            <Tr key={q.id} className="cursor-pointer" onClick={() => setOpenId(q.id)}>
              <Td className="font-semibold whitespace-nowrap text-navy tabular">{q.id}</Td>
              {showClient && <Td className="font-medium whitespace-nowrap text-slate-700">{getClient(data, q.clientId)?.name}</Td>}
              <Td className="hidden max-w-xs truncate text-slate-600 lg:table-cell">{q.title}</Td>
              <Td className="hidden whitespace-nowrap text-slate-600 md:table-cell">{formatDate(q.issuedAt)}</Td>
              <Td className="text-right font-semibold whitespace-nowrap text-navy tabular">{formatCurrency(q.amount)}</Td>
              <Td>
                <Badge tone={QUOTE_STATUS_META[q.status].tone} size="xs">{QUOTE_STATUS_META[q.status].label}</Badge>
              </Td>
              <Td>
                <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  {q.status === "EN_ATTENTE" && (
                    <>
                      <button
                        onClick={() => actions.setQuoteStatus(q.id, "ACCEPTE")}
                        className="inline-flex h-8 items-center gap-1 rounded-lg bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        <Check className="size-3.5" /> Accepter
                      </button>
                      <button
                        onClick={() => actions.setQuoteStatus(q.id, "REFUSE")}
                        className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        aria-label="Marquer comme refusé"
                        title="Marquer comme refusé"
                      >
                        <X className="size-4" />
                      </button>
                    </>
                  )}
                  <button onClick={() => setOpenId(q.id)} className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-electric-50 hover:text-electric" aria-label="Voir le devis">
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>

      <ul className="divide-y divide-line sm:hidden">
        {quotes.map((q) => (
          <li key={q.id}>
            <button onClick={() => setOpenId(q.id)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-slate-50">
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-navy">{q.id}</span>
                <span className="block truncate text-xs text-muted">{showClient ? getClient(data, q.clientId)?.name : q.title}</span>
              </span>
              <span className="text-right">
                <span className="tabular block text-sm font-semibold text-navy">{formatCurrency(q.amount)}</span>
                <Badge tone={QUOTE_STATUS_META[q.status].tone} size="xs" className="mt-1">{QUOTE_STATUS_META[q.status].label}</Badge>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Modal
        open={open !== null}
        onClose={() => setOpenId(null)}
        title={open ? `Devis ${open.id}` : ""}
        subtitle={open ? `${getClient(data, open.clientId)?.name} · émis le ${formatDate(open.issuedAt)} · valable jusqu'au ${formatDate(open.validUntil)}` : undefined}
        size="lg"
        footer={
          open?.status === "EN_ATTENTE" ? (
            <>
              <Button variant="danger" icon={<X className="size-4" />} onClick={() => actions.setQuoteStatus(open.id, "REFUSE")}>
                Marquer refusé
              </Button>
              <Button variant="success" icon={<Check className="size-4" />} onClick={() => actions.setQuoteStatus(open.id, "ACCEPTE")}>
                Marquer accepté
              </Button>
            </>
          ) : undefined
        }
      >
        {open && (
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-navy">{open.title}</p>
              <Badge tone={QUOTE_STATUS_META[open.status].tone}>{QUOTE_STATUS_META[open.status].label}</Badge>
            </div>
            <div className="overflow-hidden rounded-xl border border-line">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-[10.5px] tracking-wider text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-semibold">Désignation</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Qté</th>
                    <th className="hidden px-3 py-2.5 text-right font-semibold sm:table-cell">P.U. HT</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Total HT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {open.lines.map((l, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3 text-slate-700">{l.label}</td>
                      <td className="tabular px-3 py-3 text-right text-slate-600">{l.quantity}</td>
                      <td className="tabular hidden px-3 py-3 text-right text-slate-600 sm:table-cell">{formatCurrency(l.unitPrice)}</td>
                      <td className="tabular px-4 py-3 text-right font-medium text-navy">{formatCurrency(l.quantity * l.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="space-y-1 border-t border-line bg-slate-50/60 px-4 py-3 text-sm">
                <p className="flex justify-between text-slate-600"><span>Total HT</span><span className="tabular">{formatCurrency(open.amount)}</span></p>
                <p className="flex justify-between text-slate-600"><span>TVA 20 %</span><span className="tabular">{formatCurrency(open.amount * 0.2)}</span></p>
                <p className="flex justify-between pt-1 text-base font-bold text-navy"><span>Total TTC</span><span className="tabular">{formatCurrency(open.amount * 1.2)}</span></p>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted">
              Devis fictif de démonstration. La version connectée permet l&apos;édition des lignes, l&apos;envoi par e-mail et l&apos;acceptation en ligne avec signature électronique.
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}
