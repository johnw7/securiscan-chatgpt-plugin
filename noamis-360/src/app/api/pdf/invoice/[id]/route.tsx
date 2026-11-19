import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { FinanceDocumentPdf, loadFinanceDocument } from "@/features/finance/pdf";
import { getSession } from "@/lib/auth/session";
import { requiresMfa } from "@/lib/permissions";
import { pdfResponse, renderPdf } from "@/lib/pdf/base";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Facture ou avoir PDF (la RLS masque les brouillons aux clients et cloisonne les clients entre eux). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || (requiresMfa(session.role) && session.aal !== "aal2")) return NextResponse.json({ error: "Accès refusé" }, { status: 401 });
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  const data = await loadFinanceDocument(await createClient(), "invoice", id);
  if (!data) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return pdfResponse(await renderPdf(<FinanceDocumentPdf data={data} />), `${data.kind === "avoir" ? "Avoir" : "Facture"}-${data.number ?? "brouillon"}.pdf`);
}
