import Decimal from "decimal.js";

/**
 * Export comptable du journal des ventes (structure des colonnes du FEC,
 * art. A47 A-1 du LPF), séparateur « | », montants avec virgule décimale.
 * Facture : débit 411 (TTC) / crédit 706 (HT) / crédit 44571 (TVA).
 * Avoir : écritures inverses. À importer dans le logiciel comptable / à valider
 * par l'expert-comptable (plan de comptes à adapter).
 */
export type ExportInvoice = {
  number: string;
  kind: "facture" | "avoir";
  issue_date: string;
  client_name: string;
  client_code: string;
  total_ht: string | number;
  total_vat: string | number;
  total_ttc: string | number;
};

export const FEC_COLUMNS = [
  "JournalCode", "JournalLib", "EcritureNum", "EcritureDate", "CompteNum", "CompteLib", "CompAuxNum", "CompAuxLib",
  "PieceRef", "PieceDate", "EcritureLib", "Debit", "Credit", "EcritureLet", "DateLet", "ValidDate", "Montantdevise", "Idevise",
] as const;

const amount = (v: Decimal) => v.abs().toFixed(2).replace(".", ",");
const ymd = (d: string) => d.replaceAll("-", "").slice(0, 8);
const clean = (s: string) => s.replace(/[|\r\n]/g, " ").trim();

export function buildSalesJournal(invoices: ExportInvoice[], accounts = { client: "411000", revenue: "706000", vat: "445710" }): string {
  const lines: string[] = [FEC_COLUMNS.join("|")];
  [...invoices]
    .sort((a, b) => a.issue_date.localeCompare(b.issue_date) || a.number.localeCompare(b.number))
    .forEach((inv, i) => {
      const num = String(i + 1).padStart(6, "0");
      const ttc = new Decimal(inv.total_ttc);
      const ht = new Decimal(inv.total_ht);
      const vat = new Decimal(inv.total_vat);
      const isCredit = inv.kind === "avoir" || ttc.isNegative();
      const lib = clean(`${inv.kind === "avoir" ? "Avoir" : "Facture"} ${inv.number} ${inv.client_name}`).slice(0, 100);
      const row = (account: string, accountLib: string, aux: [string, string], debit: Decimal | null, credit: Decimal | null) =>
        [
          "VT", "Ventes", num, ymd(inv.issue_date), account, accountLib, aux[0], clean(aux[1]), inv.number, ymd(inv.issue_date), lib,
          debit ? amount(debit) : "0,00", credit ? amount(credit) : "0,00", "", "", ymd(inv.issue_date), "", "EUR",
        ].join("|");
      lines.push(row(accounts.client, "Clients", [inv.client_code, inv.client_name], isCredit ? null : ttc, isCredit ? ttc : null));
      lines.push(row(accounts.revenue, "Prestations de services", ["", ""], isCredit ? ht : null, isCredit ? null : ht));
      if (!vat.isZero()) lines.push(row(accounts.vat, "TVA collectée", ["", ""], isCredit ? vat : null, isCredit ? null : vat));
    });
  return `${lines.join("\r\n")}\r\n`;
}

/** Contrôle d'équilibre débit = crédit (par écriture et global). */
export function isBalanced(journal: string): boolean {
  const rows = journal.trim().split(/\r?\n/).slice(1).map((l) => l.split("|"));
  const byEntry = new Map<string, Decimal>();
  for (const r of rows) {
    const d = new Decimal((r[11] ?? "0").replace(",", "."));
    const c = new Decimal((r[12] ?? "0").replace(",", "."));
    byEntry.set(r[2]!, (byEntry.get(r[2]!) ?? new Decimal(0)).plus(d).minus(c));
  }
  return [...byEntry.values()].every((v) => v.isZero());
}
