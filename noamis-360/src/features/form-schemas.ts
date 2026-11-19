import { z } from "zod";
import { auditReportSchema, auditSchema, observationSchema, recommendationSchema, riskSchema, templateSchema } from "./audit/schemas";
import { closureSchema, criterionSchema, decisionSchema, meetingSchema, milestoneSchema, offerSchema, projectSchema, receptionSchema, specificationSchema, vendorSchema } from "./project/schemas";
import { aiDraftSchema, referenceSchema, reportSchema, sourceSchema } from "./intelligence/schemas";
import { documentMetaSchema, shareSchema } from "./docs/schemas";
import { catalogSchema, invoiceSchema, lineSchema, paymentSchema, quoteSchema, reminderSchema } from "./finance/schemas";
import { approvalSchema } from "./connect/schemas";
import { inviteSchema, orgSchema, profileSchema } from "./admin/schemas";
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
  project: projectSchema,
  specification: specificationSchema,
  milestone: milestoneSchema,
  vendor: vendorSchema,
  criterion: criterionSchema,
  offer: offerSchema,
  meeting: meetingSchema,
  decision: decisionSchema,
  reception: receptionSchema,
  closure: closureSchema,
  source: sourceSchema,
  report: reportSchema,
  reference: referenceSchema,
  aiDraft: aiDraftSchema,
  document: documentMetaSchema,
  share: shareSchema,
  catalog: catalogSchema,
  quote: quoteSchema,
  line: lineSchema,
  invoice: invoiceSchema,
  payment: paymentSchema,
  reminder: reminderSchema,
  approval: approvalSchema,
  invite: inviteSchema,
  organization: orgSchema,
  profile: profileSchema,
  member: z.object({ user_id: z.string().uuid("Sélectionnez un collaborateur") }),
} satisfies Record<string, z.ZodType>;

export type SchemaKey = keyof typeof FORM_SCHEMAS;
