import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { signedDownloadUrl } from "@/features/docs/storage";
import { logger } from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Lien de partage temporaire : le jeton est haché (SHA-256) puis vérifié
 * (expiration, révocation, quota) par la fonction SQL consume_document_share.
 * Les rapports de sûreté ne peuvent jamais faire l'objet d'un lien.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{40,64}$/.test(token)) return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 404 });
  const hash = createHash("sha256").update(token).digest("hex");
  const { data, error } = await createAdminClient().rpc("consume_document_share", { p_token_hash: hash });
  if (error) logger.error("share.consume_failed", { message: error.message });
  const row = data?.[0];
  if (!row) return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 404 });
  const url = await signedDownloadUrl(row.storage_bucket, row.storage_path, row.file_name, 30);
  return NextResponse.redirect(url, { headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex" } });
}
