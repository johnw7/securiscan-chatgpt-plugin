import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { signedDownloadUrl } from "@/features/docs/storage";
import { getSession } from "@/lib/auth/session";
import { requiresMfa } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Téléchargement autorisé côté serveur : la version n'est lue que si la RLS
 * l'autorise (personnel habilité ou client propriétaire d'un document partagé),
 * puis une URL signée valable 60 secondes est délivrée.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || (requiresMfa(session.role) && session.aal !== "aal2")) return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
  const { id } = await params;
  const versionParam = request.nextUrl.searchParams.get("version");
  if (!z.string().uuid().safeParse(id).success || (versionParam && !/^\d{1,5}$/.test(versionParam))) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const supabase = await createClient();
  const { data: doc } = await supabase.from("documents").select("id, current_version").eq("id", id).maybeSingle();
  if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  const version = versionParam ? Number(versionParam) : doc.current_version;
  const { data: v } = await supabase.from("document_versions").select("storage_bucket, storage_path, file_name").eq("document_id", id).eq("version", version).maybeSingle();
  if (!v) return NextResponse.json({ error: "Version introuvable" }, { status: 404 });
  const url = await signedDownloadUrl(v.storage_bucket, v.storage_path, v.file_name, 60);
  return NextResponse.redirect(url, { headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
}
