import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ServerSupabase } from "@/lib/supabase/server";
import { storagePath } from "@/lib/files";
import type { Database } from "@/types/database";

type DocInsert = Database["public"]["Tables"]["documents"]["Insert"];

/**
 * Enregistre une nouvelle version d'un document :
 * 1. la ligne `documents` est créée/lue avec le client de l'utilisateur (RLS) ;
 * 2. le fichier est déposé dans le bucket privé avec la clé de service ;
 * 3. la version est enregistrée avec le client de l'utilisateur (RLS) ;
 *    en cas de refus, le fichier déposé est supprimé.
 */
export async function storeDocumentVersion(
  supabase: ServerSupabase,
  target: { documentId: string } | { create: DocInsert },
  file: { bytes: Uint8Array; fileName: string; mime: string; ext: string; sha256: string; comment?: string | null },
): Promise<{ documentId: string; version: number }> {
  let documentId: string;
  let organizationId: string;
  if ("documentId" in target) {
    const { data, error } = await supabase.from("documents").select("id, organization_id, archived_at").eq("id", target.documentId).maybeSingle();
    if (error) throw error;
    if (!data) throw { code: "42501" };
    if (data.archived_at) throw { code: "23514", message: "Document archivé : restaurez-le avant d'ajouter une version" };
    documentId = data.id;
    organizationId = data.organization_id;
  } else {
    const { data, error } = await supabase.from("documents").insert(target.create).select("id, organization_id").single();
    if (error) throw error;
    documentId = data.id;
    organizationId = data.organization_id;
  }

  const path = storagePath(organizationId, `documents/${documentId}`, file.ext);
  const admin = createAdminClient();
  const { error: upErr } = await admin.storage.from("documents").upload(path, file.bytes, { contentType: file.mime, upsert: false });
  if (upErr) throw { code: "STORAGE", message: upErr.message };

  const { data: version, error } = await supabase
    .from("document_versions")
    .insert({
      document_id: documentId, storage_bucket: "documents", storage_path: path, file_name: file.fileName, mime_type: file.mime,
      size_bytes: file.bytes.byteLength, sha256: file.sha256, comment: file.comment ?? null, version: 0,
    })
    .select("version")
    .single();
  if (error) {
    await admin.storage.from("documents").remove([path]);
    if (!("documentId" in target)) await supabase.from("documents").update({ deleted_at: new Date().toISOString() }).eq("id", documentId);
    throw error;
  }
  return { documentId, version: version.version };
}

/** URL signée de courte durée pour un téléchargement autorisé. */
export async function signedDownloadUrl(bucket: string, path: string, fileName: string, seconds = 60) {
  const { data, error } = await createAdminClient().storage.from(bucket).createSignedUrl(path, seconds, { download: fileName });
  if (error || !data) throw { code: "STORAGE", message: error?.message };
  return data.signedUrl;
}
