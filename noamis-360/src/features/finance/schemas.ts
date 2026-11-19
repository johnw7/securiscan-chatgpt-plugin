import { z } from "zod";
import { checkbox, optionalDate, optionalText, optionalUuid, requiredText, uuid } from "@/lib/validation/common";

const num = (min: number, max: number, msg = "Valeur invalide") =>
  z.preprocess((v) => (typeof v === "string" ? Number(v.replace(",", ".").replace(/\s/g, "")) : v), z.number({ message: msg }).min(min, msg).max(max, msg));
const vat = z.preprocess((v) => (typeof v === "string" ? Number(v) : v), z.union([z.literal(0), z.literal(2.1), z.literal(5.5), z.literal(10), z.literal(20)], { message: "Taux de TVA invalide" }));

export const catalogSchema = z.object({
  id: optionalUuid,
  code: z.string().trim().min(2).max(30).regex(/^[A-Z0-9_-]+$/i, "Code : lettres, chiffres, - et _"),
  name: requiredText("Libellé", 2, 200),
  description: optionalText(2000),
  service_type: optionalText(60),
  unit: requiredText("Unité", 1, 30),
  unit_price: num(0, 9_999_999, "Prix invalide"),
  vat_rate: vat,
  is_active: checkbox,
});

export const quoteSchema = z
  .object({
    id: optionalUuid,
    client_id: uuid,
    mission_id: optionalUuid,
    title: requiredText("Objet", 3, 200),
    issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date requise"),
    valid_until: optionalDate,
    discount_rate: num(0, 100, "Remise entre 0 et 100 %"),
    introduction: optionalText(5000),
    terms: optionalText(10000),
    payment_terms: optionalText(1000),
  })
  .refine((d) => !d.valid_until || d.valid_until >= d.issue_date, { message: "La validité doit suivre la date d'émission", path: ["valid_until"] });

export const lineSchema = z.object({
  id: optionalUuid,
  catalog_item_id: optionalUuid,
  description: requiredText("Désignation", 1, 2000),
  quantity: num(0.001, 999_999, "Quantité invalide"),
  unit: requiredText("Unité", 1, 30),
  unit_price: num(0, 9_999_999, "Prix invalide"),
  discount_rate: num(0, 100, "Remise entre 0 et 100 %"),
  vat_rate: vat,
  position: z.coerce.number().int().min(0).max(999).default(0),
});

export const invoiceSchema = z.object({
  id: optionalUuid,
  client_id: uuid,
  mission_id: optionalUuid,
  title: requiredText("Objet", 3, 200),
  service_date: optionalDate,
  due_date: optionalDate,
  discount_rate: num(0, 100, "Remise entre 0 et 100 %"),
  payment_terms: optionalText(1000),
  notes: optionalText(3000),
});

export const paymentSchema = z.object({
  amount: num(0.01, 99_999_999, "Montant invalide"),
  paid_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date requise"),
  method: z.enum(["virement", "cheque", "carte", "especes", "prelevement", "autre"]),
  reference: optionalText(100),
  notes: optionalText(500),
});

export const reminderSchema = z.object({
  level: z.coerce.number().int().min(1).max(3),
  channel: z.enum(["email", "courrier", "telephone", "autre"]),
  notes: optionalText(1000),
});

export const exportSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
