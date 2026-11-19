import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/ui/entity-form";
import { PageHeader, StatCard } from "@/components/ui/misc";
import { saveLead } from "@/features/pilot/actions";
import { leadFields } from "@/features/pilot/fields";
import { LeadsBoard } from "@/features/pilot/leads-board";
import { getStaffOptions } from "@/features/pilot/queries";
import { requireCapability } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatEUR } from "@/lib/utils";

export const metadata: Metadata = { title: "Pipeline commercial" };

export default async function LeadsPage() {
  const session = await requireCapability("crm.manage");
  const supabase = await createClient();
  const [{ data }, staff] = await Promise.all([
    supabase.from("leads").select("*, profiles!leads_owner_id_fkey(full_name)").is("deleted_at", null).order("created_at", { ascending: false }),
    getStaffOptions(),
  ]);
  const leads = (data ?? []).map((l) => ({
    ...l,
    estimated_amount: l.estimated_amount === null ? null : Number(l.estimated_amount),
    owner: (l.profiles as { full_name: string | null } | null)?.full_name ?? null,
  }));
  const open = leads.filter((l) => !["gagne", "perdu"].includes(l.stage));
  const won = leads.filter((l) => l.stage === "gagne");
  const closed = leads.filter((l) => ["gagne", "perdu"].includes(l.stage));
  return (
    <>
      <PageHeader
        eyebrow="NOAMIS PILOT"
        title="Pipeline commercial"
        description="Prospects et opportunités, du premier contact à la signature. Les demandes issues du diagnostic PROTECT arrivent automatiquement en « Nouveau »."
        actions={
          <FormDialog
            title="Nouvelle opportunité"
            size="lg"
            trigger={<Button><Plus /> Nouvelle opportunité</Button>}
            schema="lead"
            fields={leadFields(staff)}
            defaultValues={{ stage: "nouveau", source: "autre", owner_id: session.userId, probability: 20 }}
            action={saveLead}
            successMessage="Opportunité créée"
          />
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Opportunités ouvertes" value={open.length} hint={formatEUR(open.reduce((s, l) => s + (l.estimated_amount ?? 0), 0))} />
        <StatCard label="Valeur pondérée" value={formatEUR(open.reduce((s, l) => s + ((l.estimated_amount ?? 0) * (l.probability ?? 0)) / 100, 0))} tone="info" />
        <StatCard label="Taux de transformation" value={closed.length ? `${Math.round((won.length / closed.length) * 100)} %` : "—"} tone="success" hint={`${won.length} gagnée(s) sur ${closed.length} clôturée(s)`} />
      </div>
      <LeadsBoard leads={leads} staff={staff} />
    </>
  );
}
