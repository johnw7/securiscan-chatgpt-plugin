import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/ui/entity-form";
import { PageHeader } from "@/components/ui/misc";
import { saveMission } from "@/features/pilot/actions";
import { missionFields } from "@/features/pilot/fields";
import { getClientOptions, getStaffOptions } from "@/features/pilot/queries";
import { MissionsTable } from "@/features/pilot/tables";
import { requireCapability } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Missions" };

export default async function MissionsPage() {
  const session = await requireCapability("mission.manage");
  const supabase = await createClient();
  const [{ data }, clients, staff] = await Promise.all([
    supabase
      .from("missions")
      .select("id, reference, title, service_type, status, progress, end_date, budget, is_confidential, clients(name), profiles!missions_manager_id_fkey(full_name)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    getClientOptions(),
    getStaffOptions(),
  ]);
  const rows = (data ?? []).map((m) => ({
    id: m.id, reference: m.reference, title: m.title, service_type: m.service_type, status: m.status, progress: m.progress,
    end_date: m.end_date, budget: m.budget === null ? null : String(m.budget), is_confidential: m.is_confidential,
    client: (m.clients as { name: string } | null)?.name ?? "—",
    manager: (m.profiles as { full_name: string | null } | null)?.full_name ?? null,
  }));
  return (
    <>
      <PageHeader
        eyebrow="NOAMIS PILOT"
        title="Missions"
        description="Toutes les missions accessibles selon vos droits (les missions confidentielles ne sont visibles que par leur équipe)."
        actions={
          <FormDialog
            title="Nouvelle mission"
            size="lg"
            trigger={<Button><Plus /> Nouvelle mission</Button>}
            schema="mission"
            fields={missionFields(clients, staff)}
            defaultValues={{ status: "planifiee", progress: 0, client_visible: true, manager_id: session.userId, service_type: "audit_surete" }}
            action={saveMission}
            redirectTo="/pilot/missions/:id"
            successMessage="Mission créée"
          />
        }
      />
      <MissionsTable rows={rows} />
    </>
  );
}
