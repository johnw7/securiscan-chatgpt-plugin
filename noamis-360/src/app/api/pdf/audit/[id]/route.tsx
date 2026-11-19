import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { AuditReportDocument, loadAuditReport } from "@/features/audit/report";
import { authorize } from "@/lib/auth/session";
import { logger } from "@/lib/logger";
import { pdfResponse, renderPdf } from "@/lib/pdf/base";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Rapport d'audit PDF : accès vérifié côté serveur (capacité + RLS). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await authorize("audit.manage");
  if (!session) return NextResponse.json({ error: "Accès refusé" }, { status: 401 });
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  const data = await loadAuditReport(await createClient(), id);
  if (!data) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  try {
    const buffer = await renderPdf(<AuditReportDocument data={data} />);
    return pdfResponse(buffer, `Rapport-audit-${data.audit.reference}.pdf`);
  } catch (error) {
    logger.error("pdf.audit_failed", { error });
    return NextResponse.json({ error: "Génération impossible" }, { status: 500 });
  }
}
