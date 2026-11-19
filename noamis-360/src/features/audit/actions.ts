"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { check, guarded } from "@/lib/actions";
import { uuid } from "@/lib/validation/common";
import { DEFAULT_METHODOLOGY } from "./default-template";
import { answersSchema, auditReportSchema, auditSchema, observationSchema, recommendationSchema, riskSchema, templateSchema } from "./schemas";
import { clampToScale, parseScoring, riskLevel, riskScore } from "./scoring";

const path = (id: string) => `/audit/${id}`;

export async function saveAudit(input: unknown) {
  return guarded("audit.manage", auditSchema, input, async ({ id, ...values }, { supabase }) => {
    if (id) {
      const current = check(await supabase.from("audits").select("status").eq("id", id).single());
      if (current.status === "valide") return { ok: false, error: "Audit validé : il n'est plus modifiable (archivez-le ou créez une nouvelle version)." };
      check(await supabase.from("audits").update(values).eq("id", id).select("id").single());
      revalidatePath(path(id));
      return { ok: true, data: { id } };
    }
    let templateId = values.template_id;
    if (!templateId) {
      const { data: tpl } = await supabase.from("audit_templates").select("id").eq("is_active", true).order("created_at").limit(1).maybeSingle();
      templateId = tpl?.id ?? null;
    }
    const row = check(
      await supabase.from("audits").insert({ ...values, template_id: templateId, methodology: DEFAULT_METHODOLOGY }).select("id").single(),
    );
    revalidatePath("/audit");
    return { ok: true, data: { id: row.id } };
  });
}

export async function saveAuditReport(auditId: string, input: unknown) {
  return guarded("audit.manage", auditReportSchema, input, async (values, { supabase }) => {
    const current = check(await supabase.from("audits").select("status").eq("id", auditId).single());
    if (current.status === "valide") return { ok: false, error: "Audit validé : rapport figé." };
    check(await supabase.from("audits").update(values).eq("id", auditId).select("id").single());
    revalidatePath(path(auditId));
    return { ok: true };
  });
}

/**
 * Sauvegarde du questionnaire avec contrôle de concurrence optimiste :
 * la mise à jour n'est appliquée que si la version serveur correspond.
 */
export async function saveAnswers(input: unknown) {
  return guarded("audit.manage", answersSchema, input, async ({ auditId, version, answers }, { supabase }) => {
    const { data, error } = await supabase
      .from("audits")
      .update({ answers, status: "en_cours" })
      .eq("id", auditId)
      .eq("draft_version", version)
      .in("status", ["brouillon", "en_cours", "en_revue"])
      .select("draft_version")
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      const { data: current } = await supabase.from("audits").select("draft_version, status").eq("id", auditId).maybeSingle();
      if (!current) return { ok: false, error: "Audit introuvable ou accès refusé." };
      if (current.status === "valide" || current.status === "archive") return { ok: false, error: "Audit validé ou archivé : questionnaire figé." };
      return { ok: false, error: `CONFLICT:${current.draft_version}` };
    }
    return { ok: true, data: { version: data.draft_version } };
  });
}

export async function saveObservation(auditId: string, input: unknown) {
  return guarded("audit.manage", observationSchema, input, async ({ id, ...values }, { supabase }) => {
    if (id) check(await supabase.from("audit_observations").update(values).eq("id", id).eq("audit_id", auditId).select("id").single());
    else check(await supabase.from("audit_observations").insert({ ...values, audit_id: auditId }).select("id").single());
    revalidatePath(path(auditId));
    return { ok: true };
  });
}

export async function deleteObservation(auditId: string, id: string) {
  return guarded("audit.manage", uuid, id, async (obsId, { supabase }) => {
    const { error } = await supabase.from("audit_observations").delete().eq("id", obsId).eq("audit_id", auditId);
    if (error) throw error;
    revalidatePath(path(auditId));
    return { ok: true, message: "Constat supprimé" };
  });
}

/** Cotation : score et niveau recalculés côté serveur selon la méthode du modèle. */
export async function saveRisk(auditId: string, input: unknown) {
  return guarded("audit.manage", riskSchema, input, async (v, { supabase }) => {
    const audit = check(await supabase.from("audits").select("status, audit_templates(scoring)").eq("id", auditId).single());
    if (audit.status === "valide") return { ok: false, error: "Audit validé : cotations figées." };
    const method = parseScoring((audit.audit_templates as { scoring: unknown } | null)?.scoring);
    const likelihood = clampToScale(v.likelihood, method.likelihood);
    const impact = clampToScale(v.impact, method.impact);
    const level = riskLevel(method, riskScore(likelihood, impact)).label;
    const row = {
      category: v.category,
      observation_id: v.observation_id,
      threat: v.threat,
      vulnerability: v.vulnerability,
      likelihood,
      impact,
      level,
      justification: v.justification,
      is_validated: false,
      criteria: {
        exposition: v.crit_exposition, attractivite: v.crit_attractivite, mesures: v.crit_mesures, consequences: v.crit_consequences,
      },
    };
    if (v.id) check(await supabase.from("risk_assessments").update(row).eq("id", v.id).eq("audit_id", auditId).select("id").single());
    else check(await supabase.from("risk_assessments").insert({ ...row, audit_id: auditId }).select("id").single());
    revalidatePath(path(auditId));
    return { ok: true, message: `Risque coté : ${level} (indicatif jusqu'à validation)` };
  });
}

export async function deleteRisk(auditId: string, id: string) {
  return guarded("audit.manage", uuid, id, async (riskId, { supabase }) => {
    const { error } = await supabase.from("risk_assessments").delete().eq("id", riskId).eq("audit_id", auditId);
    if (error) throw error;
    revalidatePath(path(auditId));
    return { ok: true, message: "Cotation supprimée" };
  });
}

export async function saveRecommendation(auditId: string, input: unknown) {
  return guarded("audit.manage", recommendationSchema, input, async ({ id, ...values }, { supabase }) => {
    const patch = { ...values, completed_at: values.status === "realisee" ? new Date().toISOString() : null };
    if (id) check(await supabase.from("recommendations").update(patch).eq("id", id).eq("audit_id", auditId).select("id").single());
    else check(await supabase.from("recommendations").insert({ ...patch, audit_id: auditId }).select("id").single());
    revalidatePath(path(auditId));
    return { ok: true };
  });
}

export async function setRecommendationStatus(auditId: string, id: string, status: string) {
  return guarded(
    "audit.manage",
    z.object({ id: uuid, status: z.enum(["proposee", "acceptee", "en_cours", "realisee", "rejetee"]) }),
    { id, status },
    async (d, { supabase }) => {
      check(
        await supabase
          .from("recommendations")
          .update({ status: d.status, completed_at: d.status === "realisee" ? new Date().toISOString() : null })
          .eq("id", d.id)
          .eq("audit_id", auditId)
          .select("id")
          .single(),
      );
      revalidatePath(path(auditId));
      return { ok: true };
    },
  );
}

export async function deleteRecommendation(auditId: string, id: string) {
  return guarded("audit.manage", uuid, id, async (recoId, { supabase }) => {
    const { error } = await supabase.from("recommendations").delete().eq("id", recoId).eq("audit_id", auditId);
    if (error) throw error;
    revalidatePath(path(auditId));
    return { ok: true, message: "Recommandation supprimée" };
  });
}

/** Validation par un consultant NOAMIS : les résultats cessent d'être indicatifs. */
export async function validateAudit(auditId: string) {
  return guarded("audit.validate", uuid, auditId, async (id, { supabase }) => {
    const { error } = await supabase.rpc("validate_audit", { p_audit: id });
    if (error) throw error;
    revalidatePath(path(id));
    return { ok: true, message: "Audit validé" };
  });
}

export async function archiveAudit(auditId: string) {
  return guarded("audit.manage", uuid, auditId, async (id, { supabase }) => {
    check(await supabase.from("audits").update({ status: "archive" }).eq("id", id).select("id").single());
    revalidatePath("/audit");
    return { ok: true, message: "Audit archivé" };
  });
}

export async function saveTemplate(input: unknown) {
  return guarded("audit.templates.manage", templateSchema, input, async ({ id, questions_json, scoring_json, ...values }, { supabase }) => {
    const categories = [...new Set(questions_json.map((q) => q.category))].map((key) => ({ key, label: key }));
    const row = { ...values, questions: questions_json, scoring: scoring_json, categories };
    if (id) {
      const current = check(await supabase.from("audit_templates").select("version").eq("id", id).single());
      check(await supabase.from("audit_templates").update({ ...row, version: current.version + 1 }).eq("id", id).select("id").single());
    } else {
      check(await supabase.from("audit_templates").insert(row).select("id").single());
    }
    revalidatePath("/audit/templates");
    return { ok: true, message: "Modèle enregistré" };
  });
}
