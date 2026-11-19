import type { FieldConfig } from "@/components/ui/entity-form";
import { CREDIBILITY, RELIABILITY, REPORT_KINDS, SEVERITY, SOURCE_KINDS, optionsOf } from "@/lib/labels";

export const sourceFields: FieldConfig[] = [
  { name: "name", label: "Nom de la source", required: true, wide: true },
  { name: "url", label: "Site (HTTPS)", type: "url", required: true, wide: true },
  { name: "feed_url", label: "Flux RSS / Atom (HTTPS)", type: "url", wide: true, hint: "Seuls les flux publiés par la source sont collectés automatiquement." },
  { name: "kind", label: "Type", type: "select", options: optionsOf(SOURCE_KINDS), required: true },
  { name: "reliability", label: "Fiabilité de la source", type: "select", options: optionsOf(RELIABILITY), required: true },
  { name: "themes", label: "Thèmes (séparés par des virgules)", wide: true },
  { name: "access_terms", label: "Conditions d'utilisation constatées", type: "textarea", rows: 2 },
  { name: "collection_allowed", label: "Collecte automatique autorisée", type: "checkbox", hint: "À cocher uniquement si les conditions d'utilisation du site le permettent. robots.txt est vérifié à chaque collecte." },
  { name: "is_active", label: "Source active", type: "checkbox" },
  { name: "notes", label: "Notes", type: "textarea", rows: 2 },
];

export const reportFields: FieldConfig[] = [
  { name: "kind", label: "Type", type: "select", options: optionsOf(REPORT_KINDS), required: true },
  { name: "severity", label: "Niveau", type: "select", options: optionsOf(SEVERITY) },
  { name: "title", label: "Titre", required: true, wide: true },
  { name: "themes", label: "Thèmes (séparés par des virgules)", wide: true },
  { name: "summary", label: "Résumé", type: "textarea", rows: 3 },
  { name: "body", label: "Analyse", type: "textarea", rows: 16, hint: "Distinguez faits vérifiés, informations à confirmer et hypothèses. Citez les références [n]." },
];

export const referenceFields: FieldConfig[] = [
  { name: "title", label: "Titre", required: true, wide: true },
  { name: "url", label: "URL", type: "url", required: true, wide: true },
  { name: "date", label: "Date de publication", type: "date", required: true },
  { name: "source", label: "Source", required: true },
  { name: "reliability", label: "Fiabilité", type: "select", options: optionsOf(RELIABILITY), required: true },
  { name: "credibility", label: "Crédibilité de l'information", type: "select", options: Object.entries(CREDIBILITY).map(([value, label]) => ({ value, label })), required: true },
];
