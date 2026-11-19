import { z } from "zod";
import { checkbox, optionalDate, optionalEmail, optionalMoney, optionalPhone, optionalText, optionalUuid, requiredText, siret, uuid } from "@/lib/validation/common";

export const PHASE_VALUES = ["cadrage", "analyse_risques", "orientations", "cahier_des_charges", "consultation", "analyse_offres", "suivi_execution", "reception", "cloture"] as const;

export const projectSchema = z.object({
  id: optionalUuid,
  name: requiredText("Nom du projet", 3, 200),
  client_id: uuid,
  mission_id: optionalUuid,
  description: optionalText(10000),
  phase: z.enum(PHASE_VALUES),
  status: z.enum(["actif", "en_pause", "abandonne"]),
  budget: optionalMoney,
  start_date: optionalDate,
  end_date: optionalDate,
  client_visible: checkbox,
});

export const specificationSchema = z.object({ specification: optionalText(100000) });

export const milestoneSchema = z.object({
  id: optionalUuid,
  title: requiredText("Jalon", 2, 200),
  due_date: optionalDate,
  status: z.enum(["a_venir", "en_cours", "atteint", "en_retard", "annule"]),
  position: z.coerce.number().int().min(0).max(1000).default(0),
});

export const vendorSchema = z.object({
  id: optionalUuid,
  name: requiredText("Raison sociale", 2, 200),
  specialty: optionalText(200),
  siret,
  email: optionalEmail,
  phone: optionalPhone,
  address_line: optionalText(200),
  city: optionalText(120),
  certifications: optionalText(500),
  notes: optionalText(3000),
});

export const criterionSchema = z.object({
  id: optionalUuid,
  label: requiredText("Critère", 2, 200),
  weight: z.coerce.number().min(1, "Poids entre 1 et 100").max(100, "Poids entre 1 et 100"),
  position: z.coerce.number().int().min(0).max(100).default(0),
});

export const offerSchema = z.object({
  id: optionalUuid,
  vendor_id: uuid,
  amount_ht: z.preprocess((v) => (typeof v === "string" ? Number(v.replace(",", ".").replace(/\s/g, "")) : v), z.number({ message: "Montant requis" }).min(0).max(99_999_999)),
  received_at: optionalDate,
  delay_weeks: z.preprocess((v) => (v === "" || v === null || v === undefined ? null : Number(v)), z.number().int().min(0).max(520).nullable()),
  scope_notes: optionalText(3000),
  strengths: optionalText(3000),
  weaknesses: optionalText(3000),
});

export const scoresSchema = z.object({
  offerId: uuid,
  scores: z.record(z.string().uuid(), z.number().min(0).max(10)),
});

export const meetingSchema = z.object({
  id: optionalUuid,
  title: requiredText("Objet", 2, 200),
  held_at: z.string().min(16, "Date requise"),
  location: optionalText(200),
  attendees: optionalText(2000),
  minutes: optionalText(50000),
  client_visible: checkbox,
});

export const decisionSchema = z.object({
  id: optionalUuid,
  kind: z.enum(["decision", "action_corrective", "reserve"]),
  title: requiredText("Intitulé", 2, 300),
  description: optionalText(5000),
  decided_by: optionalText(200),
  decided_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date requise"),
  owner: optionalText(200),
  due_date: optionalDate,
  status: z.enum(["ouverte", "en_cours", "levee", "close"]),
  meeting_id: optionalUuid,
});

export const receptionSchema = z.object({ reception_date: optionalDate, reception_notes: optionalText(10000) });
export const closureSchema = z.object({ closure_notes: requiredText("Bilan de clôture", 5, 10000) });
