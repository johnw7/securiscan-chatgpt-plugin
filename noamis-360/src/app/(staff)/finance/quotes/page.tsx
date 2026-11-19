import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/ui/entity-form";
import { PageHeader } from "@/components/ui/misc";
import { saveQuote } from "@/features/finance/actions";
import { quoteFields } from "@/features/finance/fields";
import { QuotesTable } from "@/features/finance/tables";
import { getClientOptions, getMissionOptions } from "@/features/pilot/queries";
import { requireCapability } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/utils";

export const metadata: Metadata = { title: "Devis" };

export default async function QuotesPage() {
  await requireCapability("finance.view");
  const supabase = await createClient();
  const [{ data }, clients, missions] = await Promise.all([
    supabase.from("quotes").select("id, number, title, status, issue_date, valid_until, total_ttc, clients(name)").is("deleted_at", null).order("issue_date", { ascending: false }),
    getClientOptions(),
    getMissionOptions(),
  ]);
  const today = todayISO();
  return (
    <>
      <PageHeader
        eyebrow="NOAMIS FINANCE"
        title="Devis"
        description="Propositions commerciales numérotées, calcul HT / TVA / TTC, envoi au portail client et conversion en facture."
        actions={
          <FormDialog title="Nouveau devis" size="lg" trigger={<Button><Plus /> Nouveau devis</Button>} schema="quote" fields={quoteFields(clients, missions)}
            defaultValues={{ issue_date: today, valid_until: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10), discount_rate: 0, payment_terms: "Paiement à 30 jours à réception de facture" }}
            action={saveQuote} redirectTo="/finance/quotes/:id" successMessage="Devis créé" />
        }
      />
      <QuotesTable rows={(data ?? []).map((q) => ({ id: q.id, number: q.number, title: q.title, status: q.status, issue_date: q.issue_date, valid_until: q.valid_until, total_ttc: Number(q.total_ttc), client: (q.clients as { name: string } | null)?.name ?? "—" }))} />
    </>
  );
}
