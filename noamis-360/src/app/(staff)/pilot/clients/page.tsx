import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/ui/entity-form";
import { PageHeader } from "@/components/ui/misc";
import { saveClient } from "@/features/pilot/actions";
import { clientFields } from "@/features/pilot/fields";
import { getStaffOptions } from "@/features/pilot/queries";
import { ClientsTable } from "@/features/pilot/tables";
import { requireCapability } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Clients" };

export default async function ClientsPage() {
  await requireCapability("crm.manage");
  const supabase = await createClient();
  const [{ data }, staff] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, category, status, city, email, owner_id, missions(count), profiles!clients_owner_id_fkey(full_name)")
      .is("deleted_at", null)
      .order("name"),
    getStaffOptions(),
  ]);
  const rows = (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    category: c.category,
    status: c.status,
    city: c.city,
    email: c.email,
    missions: (c.missions as unknown as Array<{ count: number }>)[0]?.count ?? 0,
    owner: (c.profiles as { full_name: string | null } | null)?.full_name ?? null,
  }));
  return (
    <>
      <PageHeader
        eyebrow="NOAMIS PILOT"
        title="Clients & contacts"
        description="Fiches clients, interlocuteurs, missions, documents et historique."
        actions={
          <FormDialog
            title="Nouveau client"
            size="lg"
            trigger={<Button><Plus /> Nouveau client</Button>}
            schema="client"
            fields={clientFields(staff)}
            defaultValues={{ category: "entreprise", status: "actif" }}
            action={saveClient}
            redirectTo="/pilot/clients/:id"
            successMessage="Client créé"
          />
        }
      />
      <ClientsTable rows={rows} />
    </>
  );
}
