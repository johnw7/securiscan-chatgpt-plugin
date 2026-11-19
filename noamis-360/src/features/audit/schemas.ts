import { z } from "zod";
import { checkbox, optionalDate, optionalMoney, optionalText, optionalUuid, requiredText, uuid } from "@/lib/validation/common";

export const AUDIT_STATUS_VALUES = ["brouillon", "en_cours", "en_revue", "valide", "archive"] as const;
export const CATEGORY_KEYS = [
  "controle_acces", "protection_perimetrique", "videoprotection", "detection_intrusion",
  "organisation_procedures", "gestion_visiteurs", "protection_actifs", "continuite_activite",
] as const;
const category = z.string().trim().min(2).max(60).regex(/^[a-z0-9_]+$/, "Catégorie invalide");

export const auditSchema = z.object({
  id: optionalUuid,
  title: requiredText("Intitulé", 3, 200),
  client_id: uuid,
  mission_id: optionalUuid,
  template_id: optionalUuid,
  site_name: optionalText(200),
  site_address: optionalText(300),
  audit_date: optionalDate,
  auditor_id: optionalUuid,
  status: z.enum(["brouillon", "en_cours", "en_revue", "archive"], { message: "Statut invalide (la validation se fait par le bouton dédié)" }),
  context: optionalText(10000),
});

export const auditReportSchema = z.object({
  methodology: optionalText(20000),
  summary: optionalText(20000),
});

const answer = z.object({
  value: z.enum(["conforme", "partiel", "non_conforme", "na"]).optional(),
  comment: z.string().max(2000).optional(),
});

export const answersSchema = z.object({
  auditId: uuid,
  version: z.number().int().min(1),
  answers: z.record(z.string().max(80), answer).refine((r) => Object.keys(r).length <= 500, "Trop de réponses"),
});

export const observationSchema = z.object({
  id: optionalUuid,
  category,
  title: requiredText("Constat", 3, 200),
  description: optionalText(5000),
  location: optionalText(200),
  is_vulnerability: checkbox,
});

export const riskSchema = z.object({
  id: optionalUuid,
  observation_id: optionalUuid,
  category,
  threat: requiredText("Menace / scénario", 3, 300),
  vulnerability: optionalText(1000),
  likelihood: z.coerce.number().int().min(1).max(10),
  impact: z.coerce.number().int().min(1).max(10),
  justification: requiredText("Justification", 10, 3000),
  crit_exposition: optionalText(500),
  crit_attractivite: optionalText(500),
  crit_mesures: optionalText(500),
  crit_consequences: optionalText(500),
});

export const recommendationSchema = z.object({
  id: optionalUuid,
  risk_id: optionalUuid,
  title: requiredText("Recommandation", 3, 300),
  description: optionalText(5000),
  priority: z.enum(["P1", "P2", "P3", "P4"]),
  horizon: z.preprocess((v) => (v === "" ? null : v), z.enum(["immediat", "3_mois", "6_mois", "12_mois", "long_terme"]).nullable()),
  estimated_cost: optionalMoney,
  owner: optionalText(200),
  status: z.enum(["proposee", "acceptee", "en_cours", "realisee", "rejetee"]),
  due_date: optionalDate,
  client_visible: checkbox,
});

const question = z.object({
  id: z.string().regex(/^[a-z0-9_-]{2,80}$/),
  category,
  label: z.string().trim().min(5).max(500),
  guidance: z.string().max(1000).optional(),
  weight: z.number().min(0).max(10).optional(),
});
const scale = z.object({ min: z.number().int().min(1), max: z.number().int().max(10), labels: z.array(z.string().max(60)).min(2).max(10) });

export const templateSchema = z.object({
  id: optionalUuid,
  name: requiredText("Nom", 3, 200),
  description: optionalText(2000),
  is_active: checkbox,
  questions_json: z.string().transform((s, ctx) => {
    try {
      const parsed = z.array(question).min(1).max(300).parse(JSON.parse(s));
      if (new Set(parsed.map((q) => q.id)).size !== parsed.length) throw new Error("Identifiants de questions en double");
      return parsed;
    } catch (e) {
      ctx.addIssue({ code: "custom", message: `Questions invalides : ${e instanceof Error ? e.message.slice(0, 200) : "format JSON incorrect"}` });
      return z.NEVER;
    }
  }),
  scoring_json: z.string().transform((s, ctx) => {
    try {
      return z
        .object({
          name: z.string().max(200),
          likelihood: scale,
          impact: scale,
          levels: z.array(z.object({ min: z.number(), max: z.number(), label: z.string().max(60), tone: z.enum(["success", "gold", "warning", "danger"]) })).min(2).max(8),
          criteria: z.array(z.object({ key: z.string().max(40), label: z.string().max(200) })).max(10),
        })
        .parse(JSON.parse(s));
    } catch (e) {
      ctx.addIssue({ code: "custom", message: `Méthode de cotation invalide : ${e instanceof Error ? e.message.slice(0, 200) : "JSON incorrect"}` });
      return z.NEVER;
    }
  }),
});
