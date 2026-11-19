import { z } from "zod";
import { QUESTIONS, type Audience } from "./questionnaire";

const answer = z.enum(["oui", "partiel", "non", "ne_sait_pas"]);

export const contactSchema = z
  .object({
    name: z.string().trim().min(2, "Nom requis").max(120),
    email: z.preprocess((v) => (v === "" || v === null ? undefined : v), z.string().trim().email("E-mail invalide").max(254).optional()),
    phone: z.preprocess((v) => (v === "" || v === null ? undefined : v), z.string().trim().regex(/^[+0-9 ().-]{6,25}$/, "Téléphone invalide").optional()),
    message: z.preprocess((v) => (v === null ? undefined : v), z.string().trim().max(2000).optional()),
    wants_appointment: z.boolean().default(false),
    availability: z.preprocess((v) => (v === null ? undefined : v), z.string().trim().max(200).optional()),
    consent: z.literal(true, { message: "Votre consentement est nécessaire pour être recontacté" }),
  })
  .refine((c) => c.email || c.phone, { message: "Indiquez un e-mail ou un téléphone", path: ["email"] });

export const protectSchema = z
  .object({
    audience: z.enum(["particulier", "commerce", "petite_entreprise"]),
    answers: z.record(z.string().regex(/^[pce]\d{1,2}$/), answer),
    department: z.preprocess((v) => (v === "" ? null : v), z.string().regex(/^([0-9]{2}|2A|2B|97[1-6])$/, "Département invalide (ex. 78, 2A, 974)").nullable()),
    contact: contactSchema.nullable(),
  })
  .refine((d) => Object.keys(d.answers).every((k) => QUESTIONS[d.audience as Audience].some((q) => q.id === k)), { message: "Réponses incohérentes", path: ["answers"] });

export type ProtectInput = z.infer<typeof protectSchema>;
