import { describe, expect, it } from "vitest";
import { amountDue, computeTotals, isOverdue, lineTotal } from "@/features/finance/calc";
import { buildSalesJournal, FEC_COLUMNS, isBalanced } from "@/features/finance/accounting";

describe("Calcul HT / TVA / TTC (Decimal)", () => {
  it("évite les erreurs de virgule flottante", () => {
    expect(lineTotal({ quantity: 3, unit_price: "0.1", vat_rate: 20 }).toFixed(2)).toBe("0.30");
    expect(computeTotals([{ quantity: 1, unit_price: 0.1, vat_rate: 0 }, { quantity: 1, unit_price: 0.2, vat_rate: 0 }]).total_ttc).toBe("0.30");
  });

  it("reproduit exactement le calcul de la base (même jeu que tests/integration/finance-db)", () => {
    const t = computeTotals(
      [
        { quantity: 3, unit_price: 333.33, discount_rate: 10, vat_rate: 20 },
        { quantity: 1.5, unit_price: 99.99, discount_rate: 0, vat_rate: 10 },
        { quantity: 1, unit_price: 0.05, discount_rate: 0, vat_rate: 20 },
      ],
      5,
    );
    expect(t).toMatchObject({ subtotal_ht: "1050.03", total_ht: "997.53", discount_amount: "52.50", total_vat: "185.26", total_ttc: "1182.79" });
    expect(t.vat_breakdown).toEqual([
      { rate: 10, base: "142.49", vat: "14.25" },
      { rate: 20, base: "855.04", vat: "171.01" },
    ]);
  });

  it("arrondit au centime « demi vers l'extérieur » comme PostgreSQL", () => {
    expect(lineTotal({ quantity: 1, unit_price: "0.125", vat_rate: 0 }).toFixed(2)).toBe("0.13");
    expect(lineTotal({ quantity: -1, unit_price: "0.125", vat_rate: 0 }).toFixed(2)).toBe("-0.13");
  });

  it("gère les avoirs (quantités négatives) et un document vide", () => {
    expect(computeTotals([{ quantity: -2, unit_price: 250, vat_rate: 0 }]).total_ttc).toBe("-500.00");
    expect(computeTotals([]).total_ttc).toBe("0.00");
  });

  it("calcule le reste dû sans jamais être négatif", () => {
    expect(amountDue({ total_ttc: "1000.00", amount_paid: "400", amount_credited: "100" })).toBe("500.00");
    expect(amountDue({ total_ttc: "100", amount_paid: "100", amount_credited: "50" })).toBe("0.00");
  });

  it("détecte les factures en retard", () => {
    expect(isOverdue({ status: "emise", due_date: "2026-01-01" }, "2026-02-01")).toBe(true);
    expect(isOverdue({ status: "payee", due_date: "2026-01-01" }, "2026-02-01")).toBe(false);
    expect(isOverdue({ status: "emise", due_date: "2026-03-01" }, "2026-02-01")).toBe(false);
  });
});

describe("Export comptable (journal des ventes, structure FEC)", () => {
  const journal = buildSalesJournal([
    { number: "FAC-2026-0002", kind: "facture", issue_date: "2026-03-02", client_name: "Client | B", client_code: "CB", total_ht: 1000, total_vat: 200, total_ttc: 1200 },
    { number: "FAC-2026-0001", kind: "facture", issue_date: "2026-03-01", client_name: "Client A", client_code: "CA", total_ht: 500, total_vat: 0, total_ttc: 500 },
    { number: "AV-2026-0001", kind: "avoir", issue_date: "2026-03-05", client_name: "Client A", client_code: "CA", total_ht: -500, total_vat: 0, total_ttc: -500 },
  ]);
  const rows = journal.trim().split("\r\n");

  it("contient les 18 colonnes réglementaires", () => {
    expect(rows[0]!.split("|")).toEqual([...FEC_COLUMNS]);
    expect(rows.slice(1).every((r) => r.split("|").length === 18)).toBe(true);
  });

  it("est équilibré écriture par écriture", () => {
    expect(isBalanced(journal)).toBe(true);
  });

  it("trie chronologiquement, débite le client sur facture et le crédite sur avoir", () => {
    expect(rows[1]).toContain("FAC-2026-0001");
    const credit = rows.filter((r) => r.includes("AV-2026-0001") && r.includes("|411000|"))[0]!.split("|");
    expect(credit[11]).toBe("0,00");
    expect(credit[12]).toBe("500,00");
  });

  it("neutralise le séparateur dans les libellés", () => {
    expect(journal).not.toContain("Client | B");
  });
});
