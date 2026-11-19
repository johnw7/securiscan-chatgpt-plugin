import type { Metadata } from "next";
import { Card, CardBody } from "@/components/ui/card";
import { EntityForm } from "@/components/ui/entity-form";
import { PageHeader } from "@/components/ui/misc";
import { saveQuote } from "@/features/finance/actions";
import { quoteFields } from "@/features/finance/fields";
import { getClientOptions, getMissionOptions } from "@/features/pilot/queries";
import { requireCapability } from "@/lib/auth/session";
import { todayISO } from "@/lib/utils";

export const metadata: Metadata = { title: "Nouveau devis" };

export default async function NewQuotePage({ searchParams }: { searchParams: Promise<{ client?: string; mission?: string }> }) {
  await requireCapability("finance.draft");
  const sp = await searchParams;
  const [clients, missions] = await Promise.all([getClientOptions(), getMissionOptions()]);
  return (
    <>
      <PageHeader eyebrow="NOAMIS FINANCE" title="Nouveau devis" />
      <Card>
        <CardBody>
          <EntityForm
            schema="quote"
            fields={quoteFields(clients, missions)}
            defaultValues={{ client_id: sp.client, mission_id: sp.mission, issue_date: todayISO(), valid_until: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10), discount_rate: 0, payment_terms: "Paiement à 30 jours à réception de facture" }}
            action={saveQuote}
            redirectTo="/finance/quotes/:id"
            submitLabel="Créer le devis"
          />
        </CardBody>
      </Card>
    </>
  );
}
