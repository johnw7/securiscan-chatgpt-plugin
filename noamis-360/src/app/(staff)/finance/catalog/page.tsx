import type { Metadata } from "next";
import { Pencil, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { FormDialog } from "@/components/ui/entity-form";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { saveCatalogItem } from "@/features/finance/actions";
import { catalogFields } from "@/features/finance/fields";
import { requireCapability } from "@/lib/auth/session";
import { SERVICE_TYPES, labelOf } from "@/lib/labels";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { formatEUR } from "@/lib/utils";

export const metadata: Metadata = { title: "Catalogue de prestations" };

export default async function CatalogPage() {
  const session = await requireCapability("finance.view");
  const manage = can(session.role, "finance.catalog.manage");
  const supabase = await createClient();
  const { data } = await supabase.from("service_catalog").select("*").order("code");
  return (
    <>
      <PageHeader
        eyebrow="NOAMIS FINANCE"
        title="Catalogue de prestations"
        description="Prestations standard reprises dans les devis et factures. Les tarifs sont définis par la direction."
        actions={manage && <FormDialog title="Nouvelle prestation" size="lg" trigger={<Button><Plus /> Prestation</Button>} schema="catalog" fields={catalogFields} defaultValues={{ unit: "forfait", vat_rate: "0", is_active: true }} action={saveCatalogItem} />}
      />
      {data?.length ? (
        <Card>
          <CardBody className="p-0">
            <ul className="divide-y divide-border">
              {data.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                  <span className="w-24 font-mono text-xs text-gold-text">{c.code}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted">{labelOf(SERVICE_TYPES, c.service_type)}</p>
                  </div>
                  <span className="tabular-nums">{formatEUR(c.unit_price)} / {c.unit}</span>
                  <Badge>TVA {c.vat_rate} %</Badge>
                  <Badge tone={c.is_active ? "success" : "neutral"}>{c.is_active ? "Active" : "Inactive"}</Badge>
                  {manage && <FormDialog title="Modifier la prestation" size="lg" trigger={<Button variant="ghost" size="icon-sm" aria-label={`Modifier ${c.name}`}><Pencil /></Button>} schema="catalog" fields={catalogFields} defaultValues={{ ...c, vat_rate: String(c.vat_rate) }} hidden={{ id: c.id }} action={saveCatalogItem} />}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ) : (
        <EmptyState title="Catalogue vide" description="Ajoutez vos prestations et leurs tarifs." />
      )}
    </>
  );
}
