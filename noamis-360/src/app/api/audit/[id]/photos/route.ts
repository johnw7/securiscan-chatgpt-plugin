import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { authorize } from "@/lib/auth/session";
import { MAX_PHOTO_BYTES, PHOTO_KINDS, storagePath, validateFile } from "@/lib/files";
import { logger } from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const idSchema = z.string().uuid();
const deny = (status: number, error: string) => NextResponse.json({ error }, { status });

/** Dépôt d'une photo de terrain sur un constat d'audit. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await authorize("audit.manage");
  if (!session) return deny(401, "Accès refusé");
  const { id } = await params;
  const form = await request.formData().catch(() => null);
  const observationId = form?.get("observationId");
  const file = form?.get("file");
  if (!idSchema.safeParse(id).success || !idSchema.safeParse(observationId).success || !(file instanceof File)) {
    return deny(400, "Requête invalide");
  }

  // Vérification des droits par la RLS (client utilisateur).
  const supabase = await createClient();
  const { data: obs } = await supabase
    .from("audit_observations")
    .select("id, photo_paths, organization_id, audits(status)")
    .eq("id", observationId as string)
    .eq("audit_id", id)
    .maybeSingle();
  if (!obs) return deny(404, "Constat introuvable");
  if ((obs.audits as { status: string } | null)?.status === "valide") return deny(409, "Audit validé : pièces figées");
  if (obs.photo_paths.length >= 20) return deny(409, "20 photos maximum par constat");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = validateFile(bytes, file.name, { allowed: PHOTO_KINDS, maxBytes: MAX_PHOTO_BYTES });
  if (!check.ok) return deny(422, check.error);

  const path = storagePath(obs.organization_id, `audits/${id}`, check.ext);
  const admin = createAdminClient();
  const { error: upErr } = await admin.storage.from("audit-photos").upload(path, bytes, { contentType: check.mime, upsert: false });
  if (upErr) {
    logger.error("audit.photo_upload_failed", { message: upErr.message });
    return deny(500, "Échec du dépôt");
  }
  const { error } = await supabase.from("audit_observations").update({ photo_paths: [...obs.photo_paths, path] }).eq("id", obs.id);
  if (error) {
    await admin.storage.from("audit-photos").remove([path]);
    return deny(403, "Accès refusé");
  }
  return NextResponse.json({ ok: true, path });
}

/** Affichage d'une photo : URL signée de 60 secondes après contrôle d'accès. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await authorize("audit.manage");
  if (!session) return deny(401, "Accès refusé");
  const { id } = await params;
  const path = request.nextUrl.searchParams.get("path") ?? "";
  if (!idSchema.safeParse(id).success || !/^[0-9a-f-]{36}\/audits\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(png|jpg|webp)$/.test(path)) {
    return deny(400, "Requête invalide");
  }
  const supabase = await createClient();
  const { data } = await supabase.from("audit_observations").select("id").eq("audit_id", id).contains("photo_paths", [path]).limit(1);
  if (!data?.length) return deny(404, "Photo introuvable");
  const { data: signed, error } = await createAdminClient().storage.from("audit-photos").createSignedUrl(path, 60);
  if (error || !signed) return deny(500, "Indisponible");
  return NextResponse.redirect(signed.signedUrl, { headers: { "Cache-Control": "private, no-store" } });
}

/** Retrait d'une photo d'un constat. */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await authorize("audit.manage");
  if (!session) return deny(401, "Accès refusé");
  const { id } = await params;
  const path = request.nextUrl.searchParams.get("path") ?? "";
  const supabase = await createClient();
  const { data: obs } = await supabase.from("audit_observations").select("id, photo_paths").eq("audit_id", id).contains("photo_paths", [path]).maybeSingle();
  if (!obs) return deny(404, "Photo introuvable");
  const { error } = await supabase.from("audit_observations").update({ photo_paths: obs.photo_paths.filter((p) => p !== path) }).eq("id", obs.id);
  if (error) return deny(403, "Accès refusé");
  await createAdminClient().storage.from("audit-photos").remove([path]);
  return NextResponse.json({ ok: true });
}
