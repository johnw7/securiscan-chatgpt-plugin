import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Plus } from "lucide-react";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { FormDialog } from "@/components/ui/entity-form";
import { EmptyState, PageHeader, Progress } from "@/components/ui/misc";
import { saveProject } from "@/features/project/actions";
import { projectFields } from "@/features/project/fields";
import { getClientOptions, getMissionOptions } from "@/features/pilot/queries";
import { requireCapability } from "@/lib/auth/session";
import { PROJECT_PHASES, PROJECT_PHASE_ORDER, PROJECT_STATUS, labelOf } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatEUR } from "@/lib/utils";

export const metadata: Metadata = { title: "Projets AMOA" };

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ mission?: string }> }) {
  await requireCapability("project.manage");
  const sp = await searchParams;
  const supabase = await createClient();
  const [{ data }, clients, missions] = await Promise.all([
    supabase.from("projects").select("id, reference, name, phase, status, budget, end_date, clients(name), vendor_offers(count)").is("deleted_at", null).order("created_at", { ascending: false }),
    getClientOptions(),
    getMissionOptions(),
  ]);
  const mission = sp.mission ? missions.find((m) => m.value === sp.mission) : undefined;
  return (
    <>
      <PageHeader
        eyebrow="NOAMIS PROJECT"
        title="Projets AMOA et coordination"
        description="De l'expression du besoin à la clôture : cahier des charges, consultation, comparaison des offres, réunions, décisions, réserves et réception."
        actions={
          <>
            <Button asChild variant="secondary"><Link href="/project/vendors"><Building2 /> Prestataires</Link></Button>
            <FormDialog
              title="Nouveau projet"
              size="lg"
              trigger={<Button><Plus /> Nouveau projet</Button>}
              schema="project"
              fields={projectFields(clients, missions)}
              defaultValues={{ phase: "cadrage", status: "actif", client_visible: true, mission_id: mission?.value, client_id: mission?.clientId }}
              action={saveProject}
              redirectTo="/project/:id"
              successMessage="Projet créé"
            />
          </>
        }
      />
      {data?.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((p) => (
            <Card key={p.id} className="transition-colors hover:border-gold/50">
              <CardBody className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-gold-text">{p.reference}</p>
                    <Link href={`/project/${p.id}`} className="font-semibold hover:text-gold-text">{p.name}</Link>
                    <p className="text-sm text-muted">{(p.clients as { name: string } | null)?.name}</p>
                  </div>
                  <StatusBadge map={PROJECT_STATUS} value={p.status} />
                </div>
                <Progress value={((PROJECT_PHASE_ORDER.indexOf(p.phase) + 1) / PROJECT_PHASE_ORDER.length) * 100} label="Progression dans la méthode" />
                <p className="text-sm">{labelOf(PROJECT_PHASES, p.phase)}</p>
                <div className="flex flex-wrap gap-2 text-xs text-muted">
                  <Badge>{formatEUR(p.budget)}</Badge>
                  <Badge>Fin : {formatDate(p.end_date)}</Badge>
                  <Badge>{(p.vendor_offers as unknown as Array<{ count: number }>)[0]?.count ?? 0} offre(s)</Badge>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="Aucun projet" description="Créez un projet pour piloter une mission d'AMOA." />
      )}
    </>
  );
}
