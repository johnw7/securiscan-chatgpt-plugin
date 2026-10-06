import { NextResponse } from "next/server";
import { createSeedData } from "@/lib/data/seed";
import { todayISO } from "@/lib/dates";
import type { InterventionStatus } from "@/lib/types";

/**
 * GET /api/interventions?status=EN_COURS
 *
 * Point d'entrée de l'API REST. En démonstration, il renvoie les données fictives ;
 * en production, il interrogera PostgreSQL via Prisma :
 *
 *   const items = await prisma.intervention.findMany({ where: { companyId, status } });
 *
 * avec contrôle d'accès (session + `can(role, "interventions:read")`).
 */
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const status = new URL(request.url).searchParams.get("status") as InterventionStatus | null;
  const { interventions } = createSeedData(todayISO());
  const items = status ? interventions.filter((i) => i.status === status) : interventions;
  return NextResponse.json({
    demo: true,
    count: items.length,
    items: items.map(({ photos, signature, ...rest }) => ({ ...rest, photoCount: photos.length, signed: Boolean(signature) })),
  });
}
