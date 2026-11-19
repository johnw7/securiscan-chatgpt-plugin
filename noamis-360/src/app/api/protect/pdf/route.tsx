import { NextResponse, type NextRequest } from "next/server";
import { ProtectPdf } from "@/features/protect/pdf";
import { scoreProtect } from "@/features/protect/questionnaire";
import { protectSchema } from "@/features/protect/schemas";
import { pdfResponse, renderPdf } from "@/lib/pdf/base";

export const runtime = "nodejs";

/** Synthèse PDF à partir des réponses envoyées (aucune lecture ni écriture en base). */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = protectSchema.safeParse({ ...(body ?? {}), contact: null, department: null });
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  const { audience, answers } = parsed.data;
  const buffer = await renderPdf(<ProtectPdf audience={audience} answers={answers} result={scoreProtect(audience, answers)} />);
  return pdfResponse(buffer, "Diagnostic-NOAMIS-PROTECT.pdf", false);
}
