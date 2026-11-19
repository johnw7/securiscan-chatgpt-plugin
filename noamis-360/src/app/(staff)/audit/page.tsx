import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/ui/entity-form";
import { PageHeader, StatCard } from "@/components/ui/misc";
import { saveAudit } from "@/features/audit/actions";
import { auditFields } from "@/features/audit/fields";
import { AuditsTable } from "@/features/audit/tables";
import { getClientOptions, getMissionOptions, getStaffOptions } from "@/features/pilot/queries";
import { requireCapability } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/utils";

export const metadata: Metadata = { title: "Audits de sûreté" };

export default async function AuditsPage({ searchParams }: { searchParams: Promise<{ new?: string; mission?: string }> }) {
  const session = await requireCapability("audit.manage");
  const sp = await searchParams;
  const supabase = await createClient();
  const [{ data }, { data: templates }, clients, missions, staff] = await Promise.all([
    supabase
      .from("audits")
      .select("id, reference, title, status, audit_date, site_name, clients(name), profiles!audits_auditor_id_fkey(full_name), risk_assessments(count)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase.from("audit_templates").select("id, name").eq("is_active", true).order("name"),
    getClientOptions(),
    getMissionOptions(),
    getStaffOptions(),
  ]);
  const rows = (data ?? []).map((a) => ({
    id: a.id, reference: a.reference, title: a.title, status: a.status, audit_date: a.audit_date, site_name: a.site_name,
    client: (a.clients as { name: string } | null)?.name ?? "—",
    auditor: (a.profiles as { full_name: string | null } | null)?.full_name ?? null,
    risks: (a.risk_assessments as unknown as Array<{ count: number }>)[0]?.count ?? 0,
  }));
  const mission = sp.mission ? missions.find((m) => m.value === sp.mission) : undefined;
  const templateOptions = (templates ?? []).map((t) => ({ value: t.id, label: t.name }));
  return (
    <>
      <PageHeader
        eyebrow="NOAMIS AUDIT"
        title="Audits de sûreté"
        description="Questionnaires terrain, constats photographiés, cotation des risques, recommandations et rapports. Les résultats restent indicatifs jusqu'à validation par un consultant."
        actions={
          <>
            {can(session.role, "audit.templates.manage") && (
              <Button asChild variant="secondary"><Link href="/audit/templates"><ClipboardList /> Modèles</Link></Button>
            )}
            <FormDialog
              title="Nouvel audit"
              size="lg"
              trigger={<Button><Plus /> Nouvel audit</Button>}
              schema="audit"
              fields={auditFields(clients, missions, staff, templateOptions)}
              defaultValues={{
                status: "brouillon", auditor_id: session.userId, audit_date: todayISO(), mission_id: mission?.value,
                client_id: mission?.clientId, template_id: templateOptions[0]?.value,
              }}
              action={saveAudit}
              redirectTo="/audit/:id"
              successMessage="Audit créé"
            />
          </>
        }
      />
      {sp.new && <p className="sr-only" role="status">Utilisez le bouton « Nouvel audit » pour créer l&apos;audit de la mission.</p>}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Audits en cours" value={rows.filter((r) => ["brouillon", "en_cours", "en_revue"].includes(r.status)).length} />
        <StatCard label="Audits validés" value={rows.filter((r) => r.status === "valide").length} tone="success" />
        <StatCard label="Risques cotés" value={rows.reduce((s, r) => s + r.risks, 0)} tone="warning" />
      </div>
      <AuditsTable rows={rows} />
    </>
  );
}
