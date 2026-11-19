"use server";
import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { guarded } from "@/lib/actions";
import { renderPdf } from "@/lib/pdf/base";
import { uuid } from "@/lib/validation/common";
import { storeDocumentVersion } from "@/features/docs/storage";
import { AuditReportDocument, loadAuditReport } from "./report";
import { createElement } from "react";

/** Génère le rapport validé et le dépose dans l'espace sécurisé du client. */
export async function publishAuditReport(auditId: string) {
  return guarded("audit.manage", uuid, auditId, async (id, { supabase }) => {
    const data = await loadAuditReport(supabase, id);
    if (!data) return { ok: false, error: "Audit introuvable ou accès refusé." };
    if (data.audit.status !== "valide") return { ok: false, error: "Seul un audit validé peut être transmis au client." };
    const buffer = await renderPdf(createElement(AuditReportDocument, { data }));
    const bytes = new Uint8Array(buffer);
    const { data: existing } = await supabase.from("documents").select("id").eq("audit_id", id).eq("category", "rapport_audit").is("deleted_at", null).maybeSingle();
    const file = {
      bytes, fileName: `Rapport-audit-${data.audit.reference}.pdf`, mime: "application/pdf", ext: "pdf",
      sha256: createHash("sha256").update(bytes).digest("hex"), comment: "Rapport validé généré par NOAMIS 360°",
    };
    const result = existing
      ? await storeDocumentVersion(supabase, { documentId: existing.id }, file)
      : await storeDocumentVersion(
          supabase,
          {
            create: {
              title: `Rapport d'audit de sûreté — ${data.audit.reference}`,
              category: "rapport_audit",
              client_id: data.audit.client_id,
              mission_id: data.audit.mission_id,
              audit_id: id,
              confidentiality: "client",
              client_visible: true,
              tags: ["audit", "rapport"],
            },
          },
          file,
        );
    revalidatePath(`/audit/${id}`);
    return { ok: true, message: `Rapport déposé dans l'espace client (version ${result.version})` };
  });
}
