import { z } from "zod";
import { auditReportSchema, auditSchema, observationSchema, recommendationSchema, riskSchema, templateSchema } from "./audit/schemas";
import { clientSchema, contactSchema, eventSchema, leadSchema, missionSchema, noteSchema, taskSchema } from "./pilot/schemas";

/**
 * Registre des schémas utilisables par les formulaires clients.
 * Les mêmes schémas sont réappliqués côté serveur dans chaque Server Action.
 */
export const FORM_SCHEMAS = {
  client: clientSchema,
  contact: contactSchema,
  lead: leadSchema,
  mission: missionSchema,
  task: taskSchema,
  note: noteSchema,
  event: eventSchema,
  audit: auditSchema,
  auditReport: auditReportSchema,
  observation: observationSchema,
  risk: riskSchema,
  recommendation: recommendationSchema,
  template: templateSchema,
  member: z.object({ user_id: z.string().uuid("Sélectionnez un collaborateur") }),
} satisfies Record<string, z.ZodType>;

export type SchemaKey = keyof typeof FORM_SCHEMAS;
