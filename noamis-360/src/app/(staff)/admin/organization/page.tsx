import type { Metadata } from "next";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EntityForm } from "@/components/ui/entity-form";
import { Notice, PageHeader } from "@/components/ui/misc";
import { saveOrganization } from "@/features/admin/actions";
import { requireCapability } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Organisation" };

export default async function OrganizationPage() {
  const session = await requireCapability("admin.organization");
  const supabase = await createClient();
  const { data: org } = await supabase.from("organizations").select("*").eq("id", session.organizationId).single();
  const numbering = (org?.numbering ?? {}) as Record<string, { prefix?: string }>;
  const settings = (org?.invoice_settings ?? {}) as Record<string, unknown>;
  return (
    <>
      <PageHeader eyebrow="Administration" title="Organisation" description="Informations légales reprises sur les devis et factures, régime de TVA et numérotation." />
      <div className="mb-6"><Notice tone="warning" title="Mentions obligatoires">Les factures ne peuvent être émises qu&apos;avec un SIREN/SIRET et une adresse complète. Les informations sont figées sur chaque facture au moment de son émission : une modification ultérieure ne change pas les factures déjà émises.</Notice></div>
      <Card>
        <CardHeader title="Identité et facturation" />
        <CardBody>
          <EntityForm
            schema="organization"
            fields={[
              { name: "name", label: "Nom commercial", required: true },
              { name: "legal_name", label: "Dénomination légale" },
              { name: "legal_form", label: "Forme juridique", placeholder: "Entrepreneur individuel" },
              { name: "rcs", label: "RCS / RNE" },
              { name: "siren", label: "SIREN" },
              { name: "siret", label: "SIRET" },
              { name: "vat_regime", label: "Régime de TVA", type: "select", required: true, options: [{ value: "franchise", label: "Franchise en base (art. 293 B du CGI)" }, { value: "normal", label: "Assujetti à la TVA" }] },
              { name: "vat_number", label: "N° TVA intracommunautaire" },
              { name: "address_line", label: "Adresse", wide: true },
              { name: "postal_code", label: "Code postal" },
              { name: "city", label: "Ville" },
              { name: "email", label: "E-mail", type: "email" },
              { name: "phone", label: "Téléphone", type: "tel" },
              { name: "website", label: "Site internet" },
              { name: "iban", label: "IBAN (affiché sur les factures)" },
              { name: "bic", label: "BIC" },
              { name: "quote_prefix", label: "Préfixe des devis", required: true, hint: "Format : PRÉFIXE-AAAA-0001" },
              { name: "invoice_prefix", label: "Préfixe des factures", required: true },
              { name: "credit_prefix", label: "Préfixe des avoirs", required: true },
              { name: "payment_terms_days", label: "Délai de paiement (jours)", type: "number", min: 0, max: 60, required: true },
              { name: "late_penalty_rate", label: "Taux des pénalités de retard", required: true, wide: true },
            ]}
            defaultValues={{
              ...org,
              quote_prefix: numbering.quote?.prefix ?? "DEV",
              invoice_prefix: numbering.invoice?.prefix ?? "FAC",
              credit_prefix: numbering.credit?.prefix ?? "AV",
              payment_terms_days: settings.payment_terms_days ?? 30,
              late_penalty_rate: settings.late_penalty_rate ?? "3 fois le taux d'intérêt légal",
            }}
            action={saveOrganization}
          />
        </CardBody>
      </Card>
    </>
  );
}
