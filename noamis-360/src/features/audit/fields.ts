import type { FieldConfig } from "@/components/ui/entity-form";
import { AUDIT_STATUS, RECO_HORIZON, RECO_PRIORITY, RECO_STATUS, optionsOf } from "@/lib/labels";
import type { ScoringMethod } from "./scoring";

type Opt = Array<{ value: string; label: string }>;

export const auditFields = (clients: Opt, missions: Opt, staff: Opt, templates: Opt): FieldConfig[] => [
  { name: "title", label: "Intitulé de l'audit", required: true, wide: true },
  { name: "client_id", label: "Client", type: "select", options: clients, required: true },
  { name: "mission_id", label: "Mission", type: "select", options: missions },
  { name: "template_id", label: "Modèle de questionnaire", type: "select", options: templates },
  { name: "auditor_id", label: "Consultant", type: "select", options: staff },
  { name: "site_name", label: "Site audité" },
  { name: "audit_date", label: "Date de la visite", type: "date" },
  { name: "site_address", label: "Localisation (commune)", wide: true, hint: "Évitez l'adresse exacte si elle n'est pas nécessaire au rapport." },
  {
    name: "status", label: "Statut", type: "select", required: true,
    options: optionsOf(AUDIT_STATUS).filter((o) => o.value !== "valide"),
  },
  { name: "context", label: "Contexte et périmètre", type: "textarea", rows: 4 },
];

export const observationFields = (categories: Opt): FieldConfig[] => [
  { name: "title", label: "Constat", required: true, wide: true },
  { name: "category", label: "Catégorie", type: "select", options: categories, required: true },
  { name: "location", label: "Emplacement" },
  { name: "description", label: "Description", type: "textarea" },
  { name: "is_vulnerability", label: "Vulnérabilité identifiée", type: "checkbox" },
];

const scaleOptions = (scale: ScoringMethod["likelihood"]) =>
  Array.from({ length: scale.max - scale.min + 1 }, (_, i) => ({
    value: String(scale.min + i),
    label: `${scale.min + i} — ${scale.labels[i] ?? ""}`,
  }));

export const riskFields = (method: ScoringMethod, categories: Opt, observations: Opt): FieldConfig[] => [
  { name: "threat", label: "Menace / scénario redouté", required: true, wide: true },
  { name: "category", label: "Catégorie", type: "select", options: categories, required: true },
  { name: "observation_id", label: "Constat lié", type: "select", options: observations },
  { name: "vulnerability", label: "Vulnérabilité exploitée", wide: true },
  { name: "likelihood", label: "Vraisemblance", type: "select", options: scaleOptions(method.likelihood), required: true },
  { name: "impact", label: "Gravité", type: "select", options: scaleOptions(method.impact), required: true },
  ...method.criteria.map((c) => ({ name: `crit_${c.key}`, label: c.label, wide: true }) as FieldConfig),
  { name: "justification", label: "Justification de la cotation", type: "textarea", required: true, hint: "Obligatoire : éléments factuels ayant conduit aux notes." },
];

export const recommendationFields = (risks: Opt): FieldConfig[] => [
  { name: "title", label: "Recommandation", required: true, wide: true },
  { name: "risk_id", label: "Risque traité", type: "select", options: risks },
  { name: "priority", label: "Priorité", type: "select", options: optionsOf(RECO_PRIORITY), required: true },
  { name: "horizon", label: "Horizon", type: "select", options: optionsOf(RECO_HORIZON) },
  { name: "estimated_cost", label: "Coût estimé (€ HT, indicatif)", type: "number", step: "0.01", min: 0 },
  { name: "owner", label: "Porteur (côté client)" },
  { name: "due_date", label: "Échéance", type: "date" },
  { name: "status", label: "Statut de mise en œuvre", type: "select", options: optionsOf(RECO_STATUS), required: true },
  { name: "description", label: "Détail", type: "textarea" },
  { name: "client_visible", label: "Visible par le client (suivi des mesures correctives)", type: "checkbox" },
];
