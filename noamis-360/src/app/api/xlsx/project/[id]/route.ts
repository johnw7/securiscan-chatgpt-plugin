import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { comparisonWorkbook, loadComparison } from "@/features/project/export";
import { authorize } from "@/lib/auth/session";
import { contentDisposition } from "@/lib/files";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Comparatif des offres au format Excel (formules de pondération incluses). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await authorize("project.manage"))) return NextResponse.json({ error: "Accès refusé" }, { status: 401 });
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  const data = await loadComparison(await createClient(), id);
  if (!data) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  const buffer = await comparisonWorkbook(data);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": contentDisposition(`Comparatif-${data.project.reference}.xlsx`),
      "Cache-Control": "private, no-store",
    },
  });
}
