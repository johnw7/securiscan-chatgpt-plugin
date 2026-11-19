import { z } from "zod";
import { optionalText, optionalUuid, requiredText } from "@/lib/validation/common";

export const inviteSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Adresse e-mail invalide").max(254),
    full_name: requiredText("Nom", 2, 120),
    role: z.enum(["super_admin", "admin", "collaborator", "client"]),
    client_id: optionalUuid,
  })
  .refine((d) => (d.role === "client") === Boolean(d.client_id), { message: "Un compte client doit être rattaché à une fiche client (et seulement lui)", path: ["client_id"] });

export const orgSchema = z.object({
  name: requiredText("Nom commercial", 2, 200),
  legal_name: optionalText(200),
  legal_form: optionalText(100),
  siren: z.preprocess((v) => (v === "" ? null : v), z.string().regex(/^\d{9}$/, "SIREN : 9 chiffres").nullable()),
  siret: z.preprocess((v) => (typeof v === "string" ? v.replace(/\s/g, "") || null : v), z.string().regex(/^\d{14}$/, "SIRET : 14 chiffres").nullable()),
  vat_number: optionalText(30),
  vat_regime: z.enum(["franchise", "normal"]),
  rcs: optionalText(100),
  address_line: optionalText(200),
  postal_code: optionalText(10),
  city: optionalText(120),
  email: z.preprocess((v) => (v === "" ? null : v), z.string().email("E-mail invalide").nullable()),
  phone: optionalText(30),
  website: optionalText(200),
  iban: z.preprocess((v) => (typeof v === "string" ? v.replace(/\s/g, "").toUpperCase() || null : v), z.string().regex(/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/, "IBAN invalide").nullable()),
  bic: optionalText(11),
  quote_prefix: z.string().trim().regex(/^[A-Z]{1,6}$/, "Préfixe : 1 à 6 lettres majuscules"),
  invoice_prefix: z.string().trim().regex(/^[A-Z]{1,6}$/, "Préfixe : 1 à 6 lettres majuscules"),
  credit_prefix: z.string().trim().regex(/^[A-Z]{1,6}$/, "Préfixe : 1 à 6 lettres majuscules"),
  payment_terms_days: z.coerce.number().int().min(0).max(60, "60 jours maximum (art. L441-10 C. com.)"),
  late_penalty_rate: requiredText("Pénalités de retard", 5, 200),
});

export const profileSchema = z.object({ full_name: requiredText("Nom", 2, 120), phone: optionalText(30), job_title: optionalText(120) });
