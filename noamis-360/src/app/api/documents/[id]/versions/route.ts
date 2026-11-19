import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { storeDocumentVersion } from "@/features/docs/storage";
import { authorize } from "@/lib/auth/session";
import { toUserMessage } from "@/lib/errors";
import { DOCUMENT_KINDS, MAX_DOCUMENT_BYTES, validateFile } from "@/lib/files";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Nouvelle version d'un document existant (personnel NOAMIS). */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await authorize("docs.manage"))) return NextResponse.json({ error: "Accès refusé" }, { status: 401 });
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  const comment = String(form?.get("comment") ?? "").slice(0, 500) || null;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = validateFile(bytes, file.name, { allowed: DOCUMENT_KINDS, maxBytes: MAX_DOCUMENT_BYTES });
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: 422 });
  try {
    const r = await storeDocumentVersion(await createClient(), { documentId: id }, {
      bytes, fileName: check.safeName, mime: check.mime, ext: check.ext, sha256: check.sha256, comment,
    });
    return NextResponse.json({ ok: true, version: r.version });
  } catch (error) {
    return NextResponse.json({ error: toUserMessage(error) }, { status: 403 });
  }
}
