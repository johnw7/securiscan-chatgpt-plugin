import { NextResponse, type NextRequest } from "next/server";
import { clientUploadSchema, documentMetaSchema } from "@/features/docs/schemas";
import { storeDocumentVersion } from "@/features/docs/storage";
import { getSession } from "@/lib/auth/session";
import { toUserMessage } from "@/lib/errors";
import { DOCUMENT_KINDS, MAX_DOCUMENT_BYTES, validateFile } from "@/lib/files";
import { logger } from "@/lib/logger";
import { can, requiresMfa } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Import d'un document (multipart) :
 * - personnel NOAMIS : métadonnées complètes ;
 * - client (portail) : dépôt d'une pièce sur son propre dossier uniquement.
 * Le fichier est contrôlé (signature, taille, contenu actif) avant stockage privé.
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || (requiresMfa(session.role) && session.aal !== "aal2")) return NextResponse.json({ error: "Accès refusé" }, { status: 401 });
  const isClient = session.role === "client";
  if (!isClient && !can(session.role, "docs.manage")) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  let meta: unknown;
  try {
    meta = JSON.parse(String(form?.get("meta") ?? "{}"));
  } catch {
    return NextResponse.json({ error: "Métadonnées invalides" }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = validateFile(bytes, file.name, { allowed: DOCUMENT_KINDS, maxBytes: MAX_DOCUMENT_BYTES });
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: 422 });

  const supabase = await createClient();
  try {
    let create;
    if (isClient) {
      const parsed = clientUploadSchema.safeParse(meta);
      if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides" }, { status: 422 });
      create = {
        ...parsed.data, client_id: session.clientId, category: "piece_client" as const, confidentiality: "client" as const,
        client_visible: true, uploaded_by_client: true, organization_id: session.organizationId,
      };
    } else {
      const parsed = documentMetaSchema.safeParse(meta);
      if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides" }, { status: 422 });
      const { id: _ignored, ...values } = parsed.data;
      void _ignored;
      create = values;
    }
    const result = await storeDocumentVersion(supabase, { create }, {
      bytes, fileName: check.safeName, mime: check.mime, ext: check.ext, sha256: check.sha256,
    });
    return NextResponse.json({ ok: true, id: result.documentId });
  } catch (error) {
    logger.warn("docs.upload_failed", { error });
    return NextResponse.json({ error: toUserMessage(error) }, { status: 403 });
  }
}
