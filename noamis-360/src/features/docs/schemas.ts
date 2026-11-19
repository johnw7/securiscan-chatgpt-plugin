import { z } from "zod";
import { checkbox, optionalText, optionalUuid, requiredText } from "@/lib/validation/common";

export const DOC_CATEGORY_VALUES = [
  "rapport_audit", "livrable", "cahier_des_charges", "devis_prestataire", "compte_rendu", "contrat", "facture", "plan", "photo", "veille", "piece_client", "autre",
] as const;

const tags = z.preprocess(
  (v) => (typeof v === "string" ? v.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean) : v),
  z.array(z.string().max(40)).max(15),
);

export const documentMetaSchema = z
  .object({
    id: optionalUuid,
    title: requiredText("Titre", 1, 300),
    category: z.enum(DOC_CATEGORY_VALUES),
    description: optionalText(3000),
    tags,
    client_id: optionalUuid,
    mission_id: optionalUuid,
    project_id: optionalUuid,
    confidentiality: z.enum(["interne", "client", "restreint"]),
    client_visible: checkbox,
  })
  .refine((d) => !d.client_visible || (d.client_id && d.confidentiality === "client"), {
    message: "Un document visible du client doit être rattaché à un client avec la confidentialité « Partagé avec le client »",
    path: ["client_visible"],
  });

export const clientUploadSchema = z.object({
  title: requiredText("Titre", 1, 300),
  description: optionalText(2000),
  mission_id: optionalUuid,
});

export const shareSchema = z.object({
  recipient: optionalText(200),
  hours: z.coerce.number().int().min(1, "1 heure minimum").max(168, "7 jours maximum"),
  max_downloads: z.coerce.number().int().min(1).max(50),
});
