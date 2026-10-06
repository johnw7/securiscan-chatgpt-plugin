/**
 * Modèle de domaine E-DUST INTERVENTION.
 *
 * Ces types sont volontairement alignés sur le schéma Prisma prévu
 * (voir `prisma/schema.prisma`) afin que le passage des données locales
 * à PostgreSQL se fasse sans réécrire l'interface.
 */

export type ISODate = string; // "YYYY-MM-DD"
export type ISODateTime = string; // "YYYY-MM-DDTHH:mm:ss"

export type InterventionStatus =
  | "A_PLANIFIER"
  | "PLANIFIEE"
  | "EN_COURS"
  | "TERMINEE"
  | "ANNULEE";

export type Priority = "NORMALE" | "IMPORTANTE" | "URGENTE";

export type InterventionType =
  | "maintenance"
  | "installation"
  | "depannage"
  | "entretien";

export type Role = "admin" | "planificateur" | "technicien" | "client";

export interface Client {
  id: string;
  name: string;
  sector: string;
  contactName: string;
  contactRole: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  clientSince: ISODate;
  /** Interventions réalisées avant la période couverte par les données de démo. */
  pastInterventions: number;
  /** Chiffre d'affaires cumulé HT (€). */
  revenue: number;
  notes?: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export type TimelineKind =
  | "created"
  | "scheduled"
  | "arrived"
  | "started"
  | "diagnostic"
  | "photo"
  | "checklist"
  | "report"
  | "signature"
  | "completed"
  | "cancelled";

export interface TimelineEvent {
  id: string;
  time: string; // "HH:mm"
  label: string;
  kind: TimelineKind;
}

export interface Photo {
  id: string;
  label: string;
  /** URL de l'image (data URL en local, URL signée une fois le stockage branché). */
  src?: string;
  /** Teinte du placeholder lorsqu'aucune image n'est disponible. */
  tone?: "blue" | "cyan" | "navy" | "slate";
  takenAt: string;
}

export interface Signature {
  dataUrl: string;
  signedBy: string;
  signedAt: ISODateTime;
}

export interface Intervention {
  id: string; // référence, ex. INT-2026-042
  clientId: string;
  type: InterventionType;
  title: string;
  description: string;
  address: string;
  date: ISODate | null;
  time: string | null; // "HH:mm"
  durationMin: number;
  technicianId: string | null;
  status: InterventionStatus;
  priority: Priority;
  amount: number; // € HT
  checklist: ChecklistItem[];
  timeline: TimelineEvent[];
  photos: Photo[];
  report: string;
  signature: Signature | null;
  createdAt: ISODateTime;
}

export type MemberStatus = "DISPONIBLE" | "EN_INTERVENTION" | "EN_LIGNE" | "ABSENT";

export interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  appRole: Role;
  phone: string;
  email: string;
  skills: string[];
  weeklyInterventions: number | null;
  /** Statut de base (le statut affiché est recalculé selon les interventions en cours). */
  baseStatus: MemberStatus;
  satisfaction: number; // /5
  onTimeRate: number; // %
  monthInterventions: number;
  color: string;
}

export type QuoteStatus = "EN_ATTENTE" | "ACCEPTE" | "REFUSE";

export interface QuoteLine {
  label: string;
  quantity: number;
  unitPrice: number;
}

export interface Quote {
  id: string; // DEV-2026-018
  clientId: string;
  title: string;
  amount: number; // € HT
  status: QuoteStatus;
  issuedAt: ISODate;
  validUntil: ISODate;
  lines: QuoteLine[];
}

export type InvoiceStatus = "PAYEE" | "EN_ATTENTE" | "EN_RETARD";

export interface Invoice {
  id: string; // FAC-2026-031
  clientId: string;
  interventionId?: string;
  amount: number;
  status: InvoiceStatus;
  issuedAt: ISODate;
  dueAt: ISODate;
}

export type DocumentType =
  | "rapport"
  | "devis"
  | "facture"
  | "contrat"
  | "attestation"
  | "photo"
  | "plan";

export interface AppDocument {
  id: string;
  name: string;
  type: DocumentType;
  clientId: string;
  interventionId?: string;
  sizeKb: number;
  date: ISODate;
  author: string;
}

export type ActivityKind =
  | "intervention_done"
  | "intervention_created"
  | "intervention_started"
  | "photos"
  | "signature"
  | "quote_accepted"
  | "quote_refused"
  | "client_new";

export interface Activity {
  id: string;
  kind: ActivityKind;
  text: string;
  at: ISODateTime;
  href?: string;
}

export interface CompanySettings {
  companyName: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerRole: string;
  email: string;
  phone: string;
  address: string;
  siret: string;
  notifyClientOnStart: boolean;
  notifyClientOnDone: boolean;
  sendReportByEmail: boolean;
  requireSignature: boolean;
}

export type Scenario = "standard" | "demo";

export interface AppData {
  /** Version du format, pour migrer les données persistées. */
  version: number;
  /** Jour de génération des données (les données de démo restent « fraîches »). */
  seededOn: ISODate;
  scenario: Scenario;
  clients: Client[];
  interventions: Intervention[];
  team: TeamMember[];
  quotes: Quote[];
  invoices: Invoice[];
  documents: AppDocument[];
  activities: Activity[];
  settings: CompanySettings;
}

export type Period = "today" | "week" | "month";
