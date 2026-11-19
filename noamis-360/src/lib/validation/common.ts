import { z } from "zod";

/** Schémas de validation partagés (client et serveur). */
export const uuid = z.string().uuid("Identifiant invalide");
export const optionalUuid = z
  .string()
  .uuid()
  .or(z.literal(""))
  .optional()
  .transform((v) => (v ? v : null));

const blankToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

export const optionalText = (max = 2000) =>
  z.preprocess(blankToNull, z.string().trim().max(max, `${max} caractères maximum`).nullable().optional()).transform((v) => v ?? null);

export const requiredText = (label: string, min = 2, max = 200) =>
  z.string().trim().min(min, `${label} : ${min} caractères minimum`).max(max, `${label} : ${max} caractères maximum`);

export const optionalEmail = z.preprocess(blankToNull, z.string().trim().toLowerCase().email("Adresse e-mail invalide").max(254).nullable().optional()).transform((v) => v ?? null);

export const optionalPhone = z.preprocess(
  blankToNull,
  z.string().trim().regex(/^[+0-9 ().-]{6,25}$/, "Numéro de téléphone invalide").nullable().optional(),
).transform((v) => v ?? null);

export const optionalDate = z.preprocess(blankToNull, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide").nullable().optional()).transform((v) => v ?? null);

export const optionalMoney = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : typeof v === "string" ? Number(v.replace(",", ".").replace(/\s/g, "")) : v),
  z.number({ message: "Montant invalide" }).min(0, "Montant positif attendu").max(99_999_999).nullable(),
);

export const siren = z.preprocess(blankToNull, z.string().regex(/^\d{9}$/, "SIREN : 9 chiffres").nullable().optional()).transform((v) => v ?? null);
export const siret = z.preprocess(
  (v) => (typeof v === "string" ? (v.replace(/\s/g, "") === "" ? null : v.replace(/\s/g, "")) : v),
  z.string().regex(/^\d{14}$/, "SIRET : 14 chiffres").nullable().optional(),
).transform((v) => v ?? null);

export const checkbox = z.preprocess((v) => v === true || v === "on" || v === "true", z.boolean());

export const passwordSchema = z
  .string()
  .min(12, "12 caractères minimum")
  .max(128)
  .regex(/[a-z]/, "Au moins une minuscule")
  .regex(/[A-Z]/, "Au moins une majuscule")
  .regex(/[0-9]/, "Au moins un chiffre");

/** Convertit les erreurs Zod en dictionnaire champ → messages. */
export function fieldErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
