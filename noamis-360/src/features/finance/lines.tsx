import { Pencil, Plus, Trash2 } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { FormDialog } from "@/components/ui/entity-form";
import type { ActionResult } from "@/lib/errors";
import { formatEUR } from "@/lib/utils";
import { CatalogPicker } from "./catalog-picker";
import { lineFields } from "./fields";

type Line = { id: string; description: string; quantity: number; unit: string; unit_price: number; discount_rate: number; vat_rate: number; total_ht: number; position: number; catalog_item_id: string | null };
type Totals = { subtotal_ht: number; discount_amount: number; total_ht: number; total_vat: number; total_ttc: number; discount_rate: number; vat_breakdown: Array<{ rate: number; base: string; vat: string }> };

/** Lignes et totaux d'un devis ou d'une facture (montants recalculés par la base). */
export function LinesCard({
  lines, totals, editable, catalog, saveAction, deleteAction, negate, addFromCatalog,
}: {
  lines: Line[];
  totals: Totals;
  editable: boolean;
  catalog: Array<{ value: string; label: string }>;
  saveAction: (input: unknown) => Promise<ActionResult>;
  deleteAction: (lineId: string) => Promise<ActionResult>;
  negate?: boolean;
  addFromCatalog?: (itemId: string) => Promise<ActionResult>;
}) {
  const fields = lineFields();
  return (
    <Card>
      <CardHeader
        title="Lignes"
        action={editable && (
          <>
          {catalog.length > 0 && addFromCatalog && <CatalogPicker catalog={catalog} action={addFromCatalog} />}
          <FormDialog title="Nouvelle ligne" size="lg" trigger={<Button size="sm"><Plus /> Ligne</Button>} schema="line" fields={fields} defaultValues={{ quantity: 1, unit: "forfait", discount_rate: 0, vat_rate: "0", position: lines.length }} action={saveAction} />
          </>
        )}
      />
      <CardBody className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Lignes du document</caption>
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted">
                <th className="px-4 py-3">Désignation</th><th className="px-4 py-3 text-right">Qté</th><th className="hidden px-4 py-3 text-right sm:table-cell">PU HT</th>
                <th className="hidden px-4 py-3 text-right sm:table-cell">Rem.</th><th className="hidden px-4 py-3 text-right sm:table-cell">TVA</th><th className="px-4 py-3 text-right">Total HT</th>
                {editable && <th className="px-4 py-3"><span className="sr-only">Actions</span></th>}
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.id} className="border-b border-border/60">
                  <td className="whitespace-pre-wrap px-4 py-3">{l.description} <span className="text-xs text-muted">({l.unit})</span></td>
                  <td className="px-4 py-3 text-right tabular-nums">{l.quantity}</td>
                  <td className="hidden px-4 py-3 text-right tabular-nums sm:table-cell">{formatEUR(l.unit_price)}</td>
                  <td className="hidden px-4 py-3 text-right tabular-nums sm:table-cell">{l.discount_rate ? `${l.discount_rate} %` : "—"}</td>
                  <td className="hidden px-4 py-3 text-right tabular-nums sm:table-cell">{l.vat_rate} %</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatEUR(l.total_ht)}</td>
                  {editable && (
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <FormDialog title="Modifier la ligne" size="lg" trigger={<Button variant="ghost" size="icon-sm" aria-label="Modifier la ligne"><Pencil /></Button>} schema="line" fields={fields} defaultValues={{ ...l, quantity: negate ? Math.abs(l.quantity) : l.quantity, vat_rate: String(l.vat_rate) }} hidden={{ id: l.id }} action={saveAction} />
                      <ActionButton variant="ghost" size="icon-sm" aria-label="Supprimer la ligne" action={deleteAction.bind(null, l.id)}><Trash2 /></ActionButton>
                    </td>
                  )}
                </tr>
              ))}
              {!lines.length && <tr><td colSpan={7} className="px-4 py-6 text-center text-muted">Aucune ligne</td></tr>}
            </tbody>
          </table>
        </div>
        <dl className="ml-auto max-w-sm space-y-1 p-5 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Total HT avant remise</dt><dd className="tabular-nums">{formatEUR(totals.subtotal_ht)}</dd></div>
          {totals.discount_amount !== 0 && <div className="flex justify-between"><dt className="text-muted">Remise ({totals.discount_rate} %)</dt><dd className="tabular-nums">− {formatEUR(totals.discount_amount)}</dd></div>}
          <div className="flex justify-between"><dt className="text-muted">Total HT</dt><dd className="tabular-nums">{formatEUR(totals.total_ht)}</dd></div>
          {totals.vat_breakdown.map((v) => (
            <div key={v.rate} className="flex justify-between"><dt className="text-muted">TVA {v.rate} % (base {formatEUR(v.base)})</dt><dd className="tabular-nums">{formatEUR(v.vat)}</dd></div>
          ))}
          <div className="flex justify-between border-t border-gold/50 pt-2 text-base font-semibold"><dt>Total TTC</dt><dd className="tabular-nums">{formatEUR(totals.total_ttc)}</dd></div>
        </dl>
      </CardBody>
    </Card>
  );
}
