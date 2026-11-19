import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { ComparisonPdf, loadComparison } from "@/features/project/export";
import { authorize } from "@/lib/auth/session";
import { pdfResponse, renderPdf } from "@/lib/pdf/base";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Comparatif des offres en PDF (droits vérifiés côté serveur + RLS). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await authorize("project.manage"))) return NextResponse.json({ error: "Accès refusé" }, { status: 401 });
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  const data = await loadComparison(await createClient(), id);
  if (!data) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return pdfResponse(await renderPdf(<ComparisonPdf data={data} />), `Comparatif-${data.project.reference}.pdf`);
}
