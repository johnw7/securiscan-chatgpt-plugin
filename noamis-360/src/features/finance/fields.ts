import type { FieldConfig } from "@/components/ui/entity-form";
import { PAYMENT_METHODS, SERVICE_TYPES, VAT_RATES, optionsOf } from "@/lib/labels";

type Opt = Array<{ value: string; label: string }>;
const vatOptions = VAT_RATES.map((r) => ({ value: String(r), label: `${String(r).replace(".", ",")} %` }));

export const catalogFields: FieldConfig[] = [
  { name: "code", label: "Code", required: true },
  { name: "name", label: "Libellé", required: true },
  { name: "service_type", label: "Prestation", type: "select", options: optionsOf(SERVICE_TYPES) },
  { name: "unit", label: "Unité", required: true },
  { name: "unit_price", label: "Prix unitaire HT (€)", type: "number", step: "0.01", min: 0, required: true },
  { name: "vat_rate", label: "TVA", type: "select", options: vatOptions, required: true },
  { name: "description", label: "Description", type: "textarea", rows: 2 },
  { name: "is_active", label: "Prestation active", type: "checkbox" },
];

export const quoteFields = (clients: Opt, missions: Opt): FieldConfig[] => [
  { name: "title", label: "Objet", required: true, wide: true },
  { name: "client_id", label: "Client", type: "select", options: clients, required: true },
  { name: "mission_id", label: "Mission", type: "select", options: missions },
  { name: "issue_date", label: "Date d'émission", type: "date", required: true },
  { name: "valid_until", label: "Valable jusqu'au", type: "date" },
  { name: "discount_rate", label: "Remise globale (%)", type: "number", step: "0.01", min: 0, max: 100, required: true },
  { name: "payment_terms", label: "Conditions de paiement" },
  { name: "introduction", label: "Introduction", type: "textarea", rows: 3 },
  { name: "terms", label: "Conditions particulières / commerciales", type: "textarea", rows: 4 },
];

export const invoiceFields = (clients: Opt, missions: Opt): FieldConfig[] => [
  { name: "title", label: "Objet", required: true, wide: true },
  { name: "client_id", label: "Client", type: "select", options: clients, required: true },
  { name: "mission_id", label: "Mission", type: "select", options: missions },
  { name: "service_date", label: "Date de la prestation", type: "date" },
  { name: "due_date", label: "Échéance (sinon calculée à l'émission)", type: "date" },
  { name: "discount_rate", label: "Remise globale (%)", type: "number", step: "0.01", min: 0, max: 100, required: true },
  { name: "payment_terms", label: "Conditions de paiement" },
  { name: "notes", label: "Mentions complémentaires", type: "textarea", rows: 2 },
];

export const lineFields = (): FieldConfig[] => [
  { name: "description", label: "Désignation", type: "textarea", rows: 2, required: true },
  { name: "quantity", label: "Quantité", type: "number", step: "0.001", min: 0, required: true },
  { name: "unit", label: "Unité", required: true },
  { name: "unit_price", label: "Prix unitaire HT (€)", type: "number", step: "0.01", min: 0, required: true },
  { name: "discount_rate", label: "Remise ligne (%)", type: "number", step: "0.01", min: 0, max: 100, required: true },
  { name: "vat_rate", label: "TVA", type: "select", options: vatOptions, required: true },
  { name: "position", label: "Ordre", type: "number", min: 0 },
];

export const paymentFields: FieldConfig[] = [
  { name: "amount", label: "Montant (€)", type: "number", step: "0.01", min: 0, required: true },
  { name: "paid_at", label: "Date", type: "date", required: true },
  { name: "method", label: "Moyen", type: "select", options: optionsOf(PAYMENT_METHODS), required: true },
  { name: "reference", label: "Référence" },
  { name: "notes", label: "Notes", type: "textarea", rows: 2 },
];

export const reminderFields: FieldConfig[] = [
  { name: "level", label: "Niveau", type: "select", options: [{ value: "1", label: "1 — Relance amiable" }, { value: "2", label: "2 — Seconde relance" }, { value: "3", label: "3 — Mise en demeure" }], required: true },
  { name: "channel", label: "Canal", type: "select", options: [{ value: "email", label: "E-mail" }, { value: "courrier", label: "Courrier" }, { value: "telephone", label: "Téléphone" }, { value: "autre", label: "Autre" }], required: true },
  { name: "notes", label: "Notes", type: "textarea", rows: 2 },
];
