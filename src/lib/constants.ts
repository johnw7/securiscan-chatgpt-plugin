import type {
  DocumentType,
  InterventionStatus,
  InterventionType,
  InvoiceStatus,
  MemberStatus,
  Priority,
  QuoteStatus,
} from "./types";
import { CHART_COLORS } from "@/config/brand";

export type Tone = "blue" | "cyan" | "green" | "amber" | "red" | "slate" | "violet" | "navy";

export const STATUS_META: Record<InterventionStatus, { label: string; tone: Tone }> = {
  A_PLANIFIER: { label: "À planifier", tone: "amber" },
  PLANIFIEE: { label: "Planifiée", tone: "blue" },
  EN_COURS: { label: "En cours", tone: "cyan" },
  TERMINEE: { label: "Terminée", tone: "green" },
  ANNULEE: { label: "Annulée", tone: "slate" },
};

export const STATUS_ORDER: InterventionStatus[] = ["A_PLANIFIER", "PLANIFIEE", "EN_COURS", "TERMINEE", "ANNULEE"];

export const PRIORITY_META: Record<Priority, { label: string; tone: Tone }> = {
  NORMALE: { label: "Normale", tone: "slate" },
  IMPORTANTE: { label: "Importante", tone: "amber" },
  URGENTE: { label: "Urgente", tone: "red" },
};

export const TYPE_META: Record<InterventionType, { label: string; color: string }> = {
  maintenance: { label: "Maintenance", color: CHART_COLORS.maintenance },
  installation: { label: "Installation", color: CHART_COLORS.installation },
  depannage: { label: "Dépannage", color: CHART_COLORS.depannage },
  entretien: { label: "Entretien", color: CHART_COLORS.entretien },
};

export const QUOTE_STATUS_META: Record<QuoteStatus, { label: string; tone: Tone }> = {
  EN_ATTENTE: { label: "En attente", tone: "amber" },
  ACCEPTE: { label: "Accepté", tone: "green" },
  REFUSE: { label: "Refusé", tone: "red" },
};

export const INVOICE_STATUS_META: Record<InvoiceStatus, { label: string; tone: Tone }> = {
  PAYEE: { label: "Payée", tone: "green" },
  EN_ATTENTE: { label: "En attente", tone: "amber" },
  EN_RETARD: { label: "En retard", tone: "red" },
};

export const MEMBER_STATUS_META: Record<MemberStatus, { label: string; tone: Tone }> = {
  DISPONIBLE: { label: "Disponible", tone: "green" },
  EN_INTERVENTION: { label: "En intervention", tone: "cyan" },
  EN_LIGNE: { label: "En ligne", tone: "blue" },
  ABSENT: { label: "Absent", tone: "slate" },
};

export const DOCUMENT_TYPE_META: Record<DocumentType, { label: string; tone: Tone }> = {
  rapport: { label: "Rapport", tone: "blue" },
  devis: { label: "Devis", tone: "violet" },
  facture: { label: "Facture", tone: "green" },
  contrat: { label: "Contrat", tone: "navy" },
  attestation: { label: "Attestation", tone: "cyan" },
  photo: { label: "Photo", tone: "amber" },
  plan: { label: "Plan", tone: "slate" },
};

export const DEFAULT_CHECKLISTS: Record<InterventionType, string[]> = {
  maintenance: ["Vérification installation", "Diagnostic", "Nettoyage", "Remplacement filtre", "Test final"],
  installation: ["Préparation du chantier", "Pose du matériel", "Raccordements", "Mise en service", "Test final"],
  depannage: ["Prise d'informations client", "Diagnostic de la panne", "Réparation", "Contrôle sécurité", "Test final"],
  entretien: ["Contrôle visuel", "Nettoyage des organes", "Mesures et réglages", "Mise à jour carnet d'entretien", "Test final"],
};
