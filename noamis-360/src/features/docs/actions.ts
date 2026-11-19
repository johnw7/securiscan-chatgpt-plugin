"use server";
import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { check, guarded } from "@/lib/actions";
import { publicEnv } from "@/lib/env";
import { uuid } from "@/lib/validation/common";
import { documentMetaSchema, shareSchema } from "./schemas";

export async function updateDocument(input: unknown) {
  return guarded("docs.manage", documentMetaSchema, input, async ({ id, ...values }, { supabase }) => {
    if (!id) return { ok: false, error: "Document manquant" };
    check(await supabase.from("documents").update(values).eq("id", id).select("id").single());
    revalidatePath(`/docs/${id}`);
    return { ok: true, message: "Métadonnées enregistrées" };
  });
}

export async function setArchived(id: string, archived: boolean) {
  return guarded("docs.manage", uuid, id, async (docId, { supabase }) => {
    check(await supabase.from("documents").update({ archived_at: archived ? new Date().toISOString() : null }).eq("id", docId).select("id").single());
    if (archived) await supabase.from("document_shares").update({ revoked_at: new Date().toISOString() }).eq("document_id", docId).is("revoked_at", null);
    revalidatePath(`/docs/${docId}`);
    return { ok: true, message: archived ? "Document archivé (liens de partage révoqués)" : "Document restauré" };
  });
}

export async function deleteDocument(id: string) {
  return guarded("mission.delete", uuid, id, async (docId, { supabase }) => {
    check(await supabase.from("documents").update({ deleted_at: new Date().toISOString(), client_visible: false }).eq("id", docId).select("id").single());
    await supabase.from("document_shares").update({ revoked_at: new Date().toISOString() }).eq("document_id", docId).is("revoked_at", null);
    revalidatePath("/docs");
    return { ok: true, message: "Document supprimé (suppression logique, versions conservées)" };
  });
}

/**
 * Lien de partage temporaire : jeton aléatoire de 256 bits, seul son hachage est
 * conservé ; durée maximale 7 jours, nombre de téléchargements limité.
 */
export async function createShare(documentId: string, input: unknown) {
  return guarded("docs.share", shareSchema, input, async ({ recipient, hours, max_downloads }, { supabase }) => {
    const token = randomBytes(32).toString("base64url");
    const token_hash = createHash("sha256").update(token).digest("hex");
    check(
      await supabase
        .from("document_shares")
        .insert({ document_id: documentId, token_hash, recipient, max_downloads, expires_at: new Date(Date.now() + hours * 3600_000).toISOString() })
        .select("id")
        .single(),
    );
    revalidatePath(`/docs/${documentId}`);
    return { ok: true, data: { url: `${publicEnv().NEXT_PUBLIC_SITE_URL}/api/share/${token}` }, message: "Lien créé : copiez-le maintenant, il ne sera plus affiché." };
  });
}

export async function revokeShare(documentId: string, shareId: string) {
  return guarded("docs.share", uuid, shareId, async (id, { supabase }) => {
    check(await supabase.from("document_shares").update({ revoked_at: new Date().toISOString() }).eq("id", id).eq("document_id", documentId).select("id").single());
    revalidatePath(`/docs/${documentId}`);
    return { ok: true, message: "Lien révoqué" };
  });
}
