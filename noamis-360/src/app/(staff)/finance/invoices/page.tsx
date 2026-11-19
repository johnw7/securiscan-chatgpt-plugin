import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/ui/entity-form";
import { PageHeader } from "@/components/ui/misc";
import { saveInvoice } from "@/features/finance/actions";
import { amountDue, isOverdue } from "@/features/finance/calc";
import { invoiceFields } from "@/features/finance/fields";
import { InvoicesTable } from "@/features/finance/tables";
import { getClientOptions, getMissionOptions } from "@/features/pilot/queries";
import { requireCapability } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/utils";

export const metadata: Metadata = { title: "Factures" };

export default async function InvoicesPage() {
  await requireCapability("finance.view");
  const supabase = await createClient();
  const [{ data }, clients, missions] = await Promise.all([
    supabase.from("invoices").select("id, number, kind, title, status, issue_date, due_date, total_ttc, amount_paid, amount_credited, clients(name)").is("deleted_at", null).order("created_at", { ascending: false }),
    getClientOptions(),
    getMissionOptions(),
  ]);
  const today = todayISO();
  return (
    <>
      <PageHeader
        eyebrow="NOAMIS FINANCE"
        title="Factures et avoirs"
        description="Les factures émises sont numérotées sans rupture, figées et archivées ; toute correction passe par un avoir."
        actions={<FormDialog title="Nouvelle facture" size="lg" trigger={<Button><Plus /> Nouvelle facture</Button>} schema="invoice" fields={invoiceFields(clients, missions)} defaultValues={{ discount_rate: 0, service_date: today, payment_terms: "Paiement à 30 jours" }} action={saveInvoice} redirectTo="/finance/invoices/:id" successMessage="Brouillon créé" />}
      />
      <InvoicesTable
        rows={(data ?? []).map((i) => ({
          id: i.id, number: i.number, kind: i.kind, title: i.title, status: i.status, issue_date: i.issue_date, due_date: i.due_date, total_ttc: Number(i.total_ttc),
          due: i.kind === "facture" && i.status !== "brouillon" ? Number(amountDue(i)) : 0, overdue: i.kind === "facture" && isOverdue(i, today),
          client: (i.clients as { name: string } | null)?.name ?? "—",
        }))}
      />
    </>
  );
}
