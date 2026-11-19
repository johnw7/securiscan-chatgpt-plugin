import type { Metadata } from "next";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { FormDialog } from "@/components/ui/entity-form";
import { EmptyState, Notice, PageHeader } from "@/components/ui/misc";
import { saveVendor } from "@/features/project/actions";
import { vendorFields } from "@/features/project/fields";
import { requireCapability } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Prestataires" };

export default async function VendorsPage() {
  await requireCapability("project.manage");
  const supabase = await createClient();
  const { data } = await supabase.from("vendors").select("*, vendor_offers(count)").is("deleted_at", null).order("name");
  return (
    <>
      <PageHeader
        eyebrow="NOAMIS PROJECT"
        title="Répertoire des prestataires"
        description="Installateurs et intégrateurs consultés lors des projets."
        actions={<FormDialog title="Nouveau prestataire" size="lg" trigger={<Button><Plus /> Nouveau prestataire</Button>} schema="vendor" fields={vendorFields} action={saveVendor} successMessage="Prestataire ajouté" />}
      />
      <div className="mb-6"><Notice tone="gold">NOAMIS est un conseil indépendant : il ne vend ni n&apos;installe d&apos;équipements. Les prestataires sont choisis et contractés directement par le client.</Notice></div>
      {data?.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((v) => (
            <Card key={v.id}>
              <CardBody>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{v.name}</p>
                    <p className="text-sm text-muted">{[v.specialty, v.city].filter(Boolean).join(" · ") || "—"}</p>
                  </div>
                  <FormDialog title="Modifier le prestataire" size="lg" trigger={<Button variant="ghost" size="icon-sm" aria-label={`Modifier ${v.name}`}><Pencil /></Button>} schema="vendor" fields={vendorFields} defaultValues={v} hidden={{ id: v.id }} action={saveVendor} />
                </div>
                <p className="mt-2 text-xs text-muted">{(v.vendor_offers as unknown as Array<{ count: number }>)[0]?.count ?? 0} offre(s) reçue(s){v.certifications ? ` · ${v.certifications}` : ""}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="Aucun prestataire" />
      )}
    </>
  );
}
