import { z } from "zod";
import {
  checkbox, optionalDate, optionalEmail, optionalMoney, optionalPhone, optionalText, optionalUuid, requiredText, siren, siret, uuid,
} from "@/lib/validation/common";

const enumOf = <T extends string>(values: readonly [T, ...T[]], message = "Valeur invalide") => z.enum(values, { message });

export const CLIENT_CATEGORY_VALUES = ["particulier", "commerce", "entreprise", "dirigeant", "vip", "collectivite"] as const;
export const SERVICE_TYPE_VALUES = ["audit_surete", "amoa", "risk_intelligence", "solutions_securite", "pilotage_projet", "gestion_crise", "prevention_cambriolage", "autre"] as const;
export const MISSION_STATUS_VALUES = ["brouillon", "planifiee", "en_cours", "en_pause", "terminee", "annulee"] as const;
export const LEAD_STAGE_VALUES = ["nouveau", "qualifie", "proposition", "negociation", "gagne", "perdu"] as const;
export const TASK_STATUS_VALUES = ["a_faire", "en_cours", "terminee", "annulee"] as const;
export const TASK_PRIORITY_VALUES = ["basse", "normale", "haute", "critique"] as const;

export const clientSchema = z.object({
  id: optionalUuid,
  name: requiredText("Nom", 2, 200),
  category: enumOf(CLIENT_CATEGORY_VALUES),
  status: enumOf(["prospect", "actif", "inactif"]),
  siren,
  siret,
  vat_number: optionalText(30),
  sector: optionalText(120),
  address_line: optionalText(200),
  postal_code: optionalText(10),
  city: optionalText(120),
  email: optionalEmail,
  phone: optionalPhone,
  website: optionalText(200),
  notes: optionalText(5000),
  owner_id: optionalUuid,
});

export const contactSchema = z.object({
  id: optionalUuid,
  client_id: uuid,
  first_name: requiredText("Prénom", 1, 100),
  last_name: requiredText("Nom", 1, 100),
  job_title: optionalText(120),
  email: optionalEmail,
  phone: optionalPhone,
  is_primary: checkbox,
  notes: optionalText(2000),
});

export const leadSchema = z.object({
  id: optionalUuid,
  title: requiredText("Intitulé", 3, 200),
  company: optionalText(200),
  contact_name: optionalText(150),
  email: optionalEmail,
  phone: optionalPhone,
  category: z.preprocess((v) => (v === "" ? null : v), enumOf(CLIENT_CATEGORY_VALUES).nullable()),
  source: enumOf(["protect", "site", "recommandation", "reseau", "salon", "autre"]),
  stage: enumOf(LEAD_STAGE_VALUES),
  estimated_amount: optionalMoney,
  probability: z.preprocess((v) => (v === "" || v === null || v === undefined ? null : Number(v)), z.number().int().min(0).max(100).nullable()),
  expected_close_date: optionalDate,
  owner_id: optionalUuid,
  message: optionalText(5000),
  lost_reason: optionalText(500),
});

export const missionSchema = z
  .object({
    id: optionalUuid,
    client_id: uuid,
    service_type: enumOf(SERVICE_TYPE_VALUES),
    title: requiredText("Intitulé", 3, 200),
    description: optionalText(10000),
    manager_id: optionalUuid,
    start_date: optionalDate,
    end_date: optionalDate,
    budget: optionalMoney,
    status: enumOf(MISSION_STATUS_VALUES),
    progress: z.coerce.number().int().min(0).max(100),
    is_confidential: checkbox,
    client_visible: checkbox,
  })
  .refine((d) => !d.start_date || !d.end_date || d.end_date >= d.start_date, {
    message: "La date de fin doit suivre la date de début",
    path: ["end_date"],
  });

export const taskSchema = z.object({
  id: optionalUuid,
  title: requiredText("Intitulé", 2, 300),
  description: optionalText(5000),
  mission_id: optionalUuid,
  project_id: optionalUuid,
  assignee_id: optionalUuid,
  due_date: optionalDate,
  priority: enumOf(TASK_PRIORITY_VALUES),
  status: enumOf(TASK_STATUS_VALUES),
  client_visible: checkbox,
});

export const noteSchema = z.object({
  body: requiredText("Note", 1, 10000),
  client_id: optionalUuid,
  mission_id: optionalUuid,
  lead_id: optionalUuid,
});

export const eventSchema = z
  .object({
    id: optionalUuid,
    title: requiredText("Titre", 2, 200),
    kind: enumOf(["rendez_vous", "visite_site", "reunion", "echeance", "interne"]),
    starts_at: z.string().min(16, "Date de début requise"),
    ends_at: z.string().min(16, "Date de fin requise"),
    location: optionalText(200),
    description: optionalText(2000),
    client_id: optionalUuid,
    mission_id: optionalUuid,
  })
  .refine((d) => d.ends_at >= d.starts_at, { message: "La fin doit suivre le début", path: ["ends_at"] });
