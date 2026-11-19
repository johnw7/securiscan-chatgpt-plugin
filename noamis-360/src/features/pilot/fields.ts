import type { FieldConfig } from "@/components/ui/entity-form";
import {
  CLIENT_CATEGORIES, CLIENT_STATUS, EVENT_KINDS, LEAD_SOURCES, LEAD_STAGES, MISSION_STATUS, optionsOf, SERVICE_TYPES, TASK_PRIORITY, TASK_STATUS,
} from "@/lib/labels";

type Opt = Array<{ value: string; label: string }>;

export const clientFields = (staff: Opt): FieldConfig[] => [
  { name: "name", label: "Raison sociale / nom", required: true, wide: true },
  { name: "category", label: "Catégorie", type: "select", options: optionsOf(CLIENT_CATEGORIES), required: true },
  { name: "status", label: "Statut", type: "select", options: optionsOf(CLIENT_STATUS), required: true },
  { name: "siren", label: "SIREN", placeholder: "9 chiffres" },
  { name: "siret", label: "SIRET", placeholder: "14 chiffres" },
  { name: "vat_number", label: "N° TVA intracommunautaire" },
  { name: "sector", label: "Secteur d'activité" },
  { name: "address_line", label: "Adresse", wide: true, autoComplete: "street-address" },
  { name: "postal_code", label: "Code postal" },
  { name: "city", label: "Ville" },
  { name: "email", label: "E-mail", type: "email" },
  { name: "phone", label: "Téléphone", type: "tel" },
  { name: "website", label: "Site internet", type: "url" },
  { name: "owner_id", label: "Responsable NOAMIS", type: "select", options: staff },
  { name: "notes", label: "Informations complémentaires", type: "textarea" },
];

export const contactFields: FieldConfig[] = [
  { name: "first_name", label: "Prénom", required: true },
  { name: "last_name", label: "Nom", required: true },
  { name: "job_title", label: "Fonction" },
  { name: "email", label: "E-mail", type: "email" },
  { name: "phone", label: "Téléphone", type: "tel" },
  { name: "is_primary", label: "Contact principal", type: "checkbox" },
  { name: "notes", label: "Notes", type: "textarea", rows: 2 },
];

export const leadFields = (staff: Opt): FieldConfig[] => [
  { name: "title", label: "Intitulé de l'opportunité", required: true, wide: true },
  { name: "company", label: "Organisation" },
  { name: "contact_name", label: "Interlocuteur" },
  { name: "email", label: "E-mail", type: "email" },
  { name: "phone", label: "Téléphone", type: "tel" },
  { name: "category", label: "Type de client", type: "select", options: optionsOf(CLIENT_CATEGORIES) },
  { name: "source", label: "Origine", type: "select", options: optionsOf(LEAD_SOURCES), required: true },
  { name: "stage", label: "Étape", type: "select", options: optionsOf(LEAD_STAGES), required: true },
  { name: "estimated_amount", label: "Montant estimé (€ HT)", type: "number", step: "0.01", min: 0 },
  { name: "probability", label: "Probabilité (%)", type: "number", min: 0, max: 100 },
  { name: "expected_close_date", label: "Signature prévue", type: "date" },
  { name: "owner_id", label: "Responsable", type: "select", options: staff },
  { name: "message", label: "Besoin exprimé", type: "textarea" },
  { name: "lost_reason", label: "Motif de perte (le cas échéant)", wide: true },
];

export const missionFields = (clients: Opt, staff: Opt): FieldConfig[] => [
  { name: "title", label: "Intitulé de la mission", required: true, wide: true },
  { name: "client_id", label: "Client", type: "select", options: clients, required: true },
  { name: "service_type", label: "Type de prestation", type: "select", options: optionsOf(SERVICE_TYPES), required: true },
  { name: "manager_id", label: "Responsable", type: "select", options: staff },
  { name: "status", label: "Statut", type: "select", options: optionsOf(MISSION_STATUS), required: true },
  { name: "start_date", label: "Date de début", type: "date" },
  { name: "end_date", label: "Date de fin", type: "date" },
  { name: "budget", label: "Budget (€ HT)", type: "number", step: "0.01", min: 0 },
  { name: "progress", label: "Avancement (%)", type: "number", min: 0, max: 100, required: true },
  { name: "description", label: "Description / périmètre", type: "textarea", rows: 5 },
  { name: "client_visible", label: "Visible dans le portail client", type: "checkbox", hint: "Le client suit l'avancement et les échéances partagées." },
  { name: "is_confidential", label: "Mission confidentielle", type: "checkbox", hint: "Accès limité au responsable, aux membres désignés et aux administrateurs." },
];

export const taskFields = (staff: Opt, missions: Opt): FieldConfig[] => [
  { name: "title", label: "Tâche", required: true, wide: true },
  { name: "mission_id", label: "Mission", type: "select", options: missions },
  { name: "assignee_id", label: "Assignée à", type: "select", options: staff },
  { name: "due_date", label: "Échéance", type: "date" },
  { name: "priority", label: "Priorité", type: "select", options: optionsOf(TASK_PRIORITY), required: true },
  { name: "status", label: "Statut", type: "select", options: optionsOf(TASK_STATUS), required: true },
  { name: "description", label: "Détails", type: "textarea", rows: 3 },
  { name: "client_visible", label: "Échéance visible par le client", type: "checkbox" },
];

export const eventFields = (clients: Opt, missions: Opt): FieldConfig[] => [
  { name: "title", label: "Titre", required: true, wide: true },
  { name: "kind", label: "Type", type: "select", options: optionsOf(EVENT_KINDS), required: true },
  { name: "location", label: "Lieu" },
  { name: "starts_at", label: "Début", type: "datetime-local", required: true },
  { name: "ends_at", label: "Fin", type: "datetime-local", required: true },
  { name: "client_id", label: "Client", type: "select", options: clients },
  { name: "mission_id", label: "Mission", type: "select", options: missions },
  { name: "description", label: "Notes", type: "textarea", rows: 3 },
];
