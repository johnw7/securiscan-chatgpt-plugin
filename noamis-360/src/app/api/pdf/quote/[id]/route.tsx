import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { FinanceDocumentPdf, loadFinanceDocument } from "@/features/finance/pdf";
import { getSession } from "@/lib/auth/session";
import { requiresMfa } from "@/lib/permissions";
import { pdfResponse, renderPdf } from "@/lib/pdf/base";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Devis PDF : personnel habilité ou client destinataire (la RLS filtre les brouillons et les autres clients). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || (requiresMfa(session.role) && session.aal !== "aal2")) return NextResponse.json({ error: "Accès refusé" }, { status: 401 });
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  const data = await loadFinanceDocument(await createClient(), "quote", id);
  if (!data) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return pdfResponse(await renderPdf(<FinanceDocumentPdf data={data} />), `Devis-${data.number}.pdf`);
}
