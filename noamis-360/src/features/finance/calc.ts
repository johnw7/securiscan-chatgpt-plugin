import Decimal from "decimal.js";

/**
 * Calcul des montants HT / TVA / TTC — strictement identique à la fonction
 * SQL private.compute_totals (la base reste la source de vérité ; ce module
 * sert à l'aperçu en temps réel et aux exports). Arrondi au centime,
 * « demi vers l'extérieur » (ROUND_HALF_UP de Decimal = round() de PostgreSQL).
 */
const D = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export type LineInput = {
  quantity: number | string;
  unit_price: number | string;
  discount_rate?: number | string | null;
  vat_rate: number | string;
};

export type Totals = {
  subtotal_ht: string;
  discount_amount: string;
  total_ht: string;
  total_vat: string;
  total_ttc: string;
  vat_breakdown: Array<{ rate: number; base: string; vat: string }>;
};

const round2 = (d: Decimal) => d.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

export function lineTotal(line: LineInput): Decimal {
  const qty = new D(line.quantity || 0);
  const pu = new D(line.unit_price || 0);
  const rem = new D(line.discount_rate || 0);
  return round2(qty.mul(pu).mul(new D(1).minus(rem.div(100))));
}

export function computeTotals(lines: LineInput[], globalDiscount: number | string = 0): Totals {
  const discountFactor = new D(1).minus(new D(globalDiscount || 0).div(100));
  const groups = new Map<string, Decimal>();
  for (const line of lines) {
    const key = new D(line.vat_rate || 0).toString();
    groups.set(key, (groups.get(key) ?? new D(0)).plus(lineTotal(line)));
  }
  let subtotal = new D(0);
  let totalHt = new D(0);
  let totalVat = new D(0);
  const breakdown: Totals["vat_breakdown"] = [];
  for (const [rate, raw] of [...groups.entries()].sort((a, b) => Number(a[0]) - Number(b[0]))) {
    const base = round2(raw.mul(discountFactor));
    const vat = round2(base.mul(new D(rate)).div(100));
    subtotal = subtotal.plus(raw);
    totalHt = totalHt.plus(base);
    totalVat = totalVat.plus(vat);
    breakdown.push({ rate: Number(rate), base: base.toFixed(2), vat: vat.toFixed(2) });
  }
  return {
    subtotal_ht: subtotal.toFixed(2),
    discount_amount: subtotal.minus(totalHt).toFixed(2),
    total_ht: totalHt.toFixed(2),
    total_vat: totalVat.toFixed(2),
    total_ttc: totalHt.plus(totalVat).toFixed(2),
    vat_breakdown: breakdown,
  };
}

/** Reste à payer d'une facture (jamais négatif). */
export function amountDue(inv: { total_ttc: number | string; amount_paid: number | string; amount_credited: number | string }): string {
  const due = new D(inv.total_ttc).minus(inv.amount_paid).minus(inv.amount_credited);
  return Decimal.max(due, 0).toFixed(2);
}

/** Facture en retard : émise, non soldée, échéance dépassée. */
export function isOverdue(inv: { status: string; due_date: string | null }, today: string): boolean {
  return (inv.status === "emise" || inv.status === "partiellement_payee") && !!inv.due_date && inv.due_date < today;
}

export function sum(values: Array<number | string | null | undefined>): number {
  return values.reduce<Decimal>((acc, v) => acc.plus(v ?? 0), new D(0)).toNumber();
}
