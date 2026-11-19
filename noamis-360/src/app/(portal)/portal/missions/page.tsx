import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState, PageHeader, Progress } from "@/components/ui/misc";
import { requireClient } from "@/lib/auth/session";
import { MISSION_STATUS, SERVICE_TYPES, labelOf } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Mes missions" };

export default async function PortalMissions() {
  await requireClient();
  const supabase = await createClient();
  const { data } = await supabase.from("missions").select("id, reference, title, service_type, status, progress, start_date, end_date").order("created_at", { ascending: false });
  return (
    <>
      <PageHeader eyebrow="NOAMIS CONNECT" title="Mes missions" description="Suivi de l'avancement et des échéances de vos missions." />
      {data?.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((m) => (
            <Card key={m.id} className="transition-colors hover:border-gold/50">
              <CardBody className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs text-gold-text">{m.reference}</p>
                    <Link href={`/portal/missions/${m.id}`} className="font-semibold hover:text-gold-text">{m.title}</Link>
                    <p className="text-sm text-muted">{labelOf(SERVICE_TYPES, m.service_type)}</p>
                  </div>
                  <StatusBadge map={MISSION_STATUS} value={m.status} />
                </div>
                <Progress value={m.progress} label={`Avancement de ${m.title}`} />
                <p className="text-xs text-muted">Du {formatDate(m.start_date)} au {formatDate(m.end_date)}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="Aucune mission partagée pour le moment" />
      )}
    </>
  );
}
