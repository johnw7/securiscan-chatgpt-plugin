import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { IntelligencePdf } from "@/features/intelligence/report-pdf";
import { getSession } from "@/lib/auth/session";
import { requiresMfa } from "@/lib/permissions";
import { pdfResponse, renderPdf } from "@/lib/pdf/base";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * PDF d'un rapport de veille : personnel NOAMIS, ou client destinataire
 * d'un rapport diffusé (la RLS ne renvoie la ligne qu'aux personnes autorisées).
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || (requiresMfa(session.role) && session.aal !== "aal2")) return NextResponse.json({ error: "Accès refusé" }, { status: 401 });
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  const supabase = await createClient();
  const { data } = await supabase.from("intelligence_reports").select("*").eq("id", id).maybeSingle();
  if (!data) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  const buffer = await renderPdf(<IntelligencePdf report={data} organization={session.organizationName} />);
  return pdfResponse(buffer, `Veille-${data.title.slice(0, 60)}.pdf`);
}
