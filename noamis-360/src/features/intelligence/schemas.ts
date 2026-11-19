import { z } from "zod";
import { checkbox, optionalText, optionalUuid, requiredText } from "@/lib/validation/common";

const httpsUrl = z.string().trim().url("URL invalide").regex(/^https:\/\//, "Adresse HTTPS requise").max(500);
const themes = z.preprocess(
  (v) => (typeof v === "string" ? v.split(",").map((s) => s.trim()).filter(Boolean) : v),
  z.array(z.string().max(60)).max(20),
);

export const sourceSchema = z.object({
  id: optionalUuid,
  name: requiredText("Nom", 2, 200),
  url: httpsUrl,
  feed_url: z.preprocess((v) => (v === "" ? null : v), httpsUrl.nullable()),
  kind: z.enum(["institutionnel", "presse", "specialise", "flux_rss", "reseau", "autre"]),
  themes,
  reliability: z.enum(["A", "B", "C", "D", "E", "F"]),
  access_terms: optionalText(1000),
  collection_allowed: checkbox,
  is_active: checkbox,
  notes: optionalText(2000),
});

export const reportSchema = z.object({
  id: optionalUuid,
  kind: z.enum(["fiche", "bulletin", "alerte"]),
  title: requiredText("Titre", 3, 300),
  summary: optionalText(3000),
  body: optionalText(50000),
  themes,
  severity: z.preprocess((v) => (v === "" ? null : v), z.enum(["information", "vigilance", "alerte"]).nullable()),
});

export const referenceSchema = z.object({
  title: requiredText("Titre", 2, 300),
  url: z.string().trim().url("URL invalide").max(500),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date de la source requise"),
  source: requiredText("Source", 2, 200),
  reliability: z.enum(["A", "B", "C", "D", "E", "F"]),
  credibility: z.coerce.number().int().min(1).max(6),
});

export const publishSchema = z.object({ client_ids: z.array(z.string().uuid()).min(1, "Sélectionnez au moins un client").max(200) });
export const aiDraftSchema = z.object({ topic: requiredText("Sujet", 3, 200) });
