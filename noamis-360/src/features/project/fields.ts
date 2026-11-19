import type { FieldConfig } from "@/components/ui/entity-form";
import { DECISION_KINDS, DECISION_STATUS, MILESTONE_STATUS, PROJECT_PHASES, PROJECT_STATUS, optionsOf } from "@/lib/labels";

type Opt = Array<{ value: string; label: string }>;

export const projectFields = (clients: Opt, missions: Opt): FieldConfig[] => [
  { name: "name", label: "Nom du projet", required: true, wide: true },
  { name: "client_id", label: "Client", type: "select", options: clients, required: true },
  { name: "mission_id", label: "Mission AMOA", type: "select", options: missions },
  { name: "phase", label: "Étape", type: "select", options: optionsOf(PROJECT_PHASES).filter((o) => o.value !== "cloture"), required: true },
  { name: "status", label: "Statut", type: "select", options: optionsOf(PROJECT_STATUS).filter((o) => o.value !== "clos"), required: true },
  { name: "budget", label: "Budget prévisionnel (€ HT)", type: "number", step: "0.01", min: 0 },
  { name: "start_date", label: "Début", type: "date" },
  { name: "end_date", label: "Fin prévue", type: "date" },
  { name: "description", label: "Objectifs du projet", type: "textarea" },
  { name: "client_visible", label: "Visible dans le portail client", type: "checkbox" },
];

export const milestoneFields: FieldConfig[] = [
  { name: "title", label: "Jalon", required: true, wide: true },
  { name: "due_date", label: "Échéance", type: "date" },
  { name: "status", label: "Statut", type: "select", options: optionsOf(MILESTONE_STATUS), required: true },
  { name: "position", label: "Ordre", type: "number", min: 0 },
];

export const vendorFields: FieldConfig[] = [
  { name: "name", label: "Raison sociale", required: true, wide: true },
  { name: "specialty", label: "Spécialités" },
  { name: "siret", label: "SIRET" },
  { name: "email", label: "E-mail", type: "email" },
  { name: "phone", label: "Téléphone", type: "tel" },
  { name: "address_line", label: "Adresse" },
  { name: "city", label: "Ville" },
  { name: "certifications", label: "Certifications / qualifications", wide: true },
  { name: "notes", label: "Notes internes", type: "textarea", rows: 3 },
];

export const criterionFields: FieldConfig[] = [
  { name: "label", label: "Critère", required: true, wide: true },
  { name: "weight", label: "Poids (%)", type: "number", min: 1, max: 100, required: true },
  { name: "position", label: "Ordre", type: "number", min: 0 },
];

export const offerFields = (vendors: Opt): FieldConfig[] => [
  { name: "vendor_id", label: "Prestataire", type: "select", options: vendors, required: true },
  { name: "amount_ht", label: "Montant (€ HT)", type: "number", step: "0.01", min: 0, required: true },
  { name: "received_at", label: "Reçue le", type: "date" },
  { name: "delay_weeks", label: "Délai (semaines)", type: "number", min: 0 },
  { name: "scope_notes", label: "Périmètre / écarts au cahier des charges", type: "textarea", rows: 3 },
  { name: "strengths", label: "Points forts", type: "textarea", rows: 2 },
  { name: "weaknesses", label: "Points de vigilance", type: "textarea", rows: 2 },
];

export const meetingFields: FieldConfig[] = [
  { name: "title", label: "Objet", required: true, wide: true },
  { name: "held_at", label: "Date et heure", type: "datetime-local", required: true },
  { name: "location", label: "Lieu" },
  { name: "attendees", label: "Participants", wide: true },
  { name: "minutes", label: "Compte rendu", type: "textarea", rows: 8 },
  { name: "client_visible", label: "Compte rendu visible par le client", type: "checkbox" },
];

export const decisionFields = (meetings: Opt): FieldConfig[] => [
  { name: "kind", label: "Type", type: "select", options: optionsOf(DECISION_KINDS), required: true },
  { name: "status", label: "Statut", type: "select", options: optionsOf(DECISION_STATUS), required: true },
  { name: "title", label: "Intitulé", required: true, wide: true },
  { name: "decided_at", label: "Date", type: "date", required: true },
  { name: "decided_by", label: "Décideur / émetteur" },
  { name: "owner", label: "Responsable du traitement" },
  { name: "due_date", label: "Échéance", type: "date" },
  { name: "meeting_id", label: "Réunion", type: "select", options: meetings },
  { name: "description", label: "Détail", type: "textarea", rows: 3 },
];
