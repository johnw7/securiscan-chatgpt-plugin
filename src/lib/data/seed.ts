import type {
  Activity,
  AppData,
  AppDocument,
  ChecklistItem,
  Intervention,
  Invoice,
  ISODate,
  Photo,
  Quote,
  QuoteStatus,
  Scenario,
} from "../types";
import { DEFAULT_CHECKLISTS } from "../constants";
import { addBusinessDays, addDays, addMinutesToTime, toISODateTime } from "../dates";
import { CLIENT_SEEDS } from "./clients";
import { INTERVENTION_SEEDS, type InterventionSeed } from "./interventions";
import { DEFAULT_SETTINGS, TEAM } from "./team";

export const DATA_VERSION = 1;
const YEAR = 2026;

export const interventionRef = (n: number) => `INT-${YEAR}-${String(n).padStart(3, "0")}`;
export const quoteRef = (n: number) => `DEV-${YEAR}-${String(n).padStart(3, "0")}`;
const invoiceRef = (n: number) => `FAC-${YEAR}-${String(n).padStart(3, "0")}`;

const REPORTS: Record<Intervention["type"], string> = {
  maintenance:
    "Installation en bon état général. Filtres nettoyés ou remplacés, mesures conformes aux préconisations du fabricant. Prochaine visite à prévoir selon le contrat.",
  installation:
    "Travaux réalisés conformément au devis. Mise en service effectuée en présence du client, essais concluants. Documentation remise.",
  depannage:
    "Panne identifiée et corrigée. Remise en service et tests de fonctionnement satisfaisants. Aucune autre anomalie constatée.",
  entretien:
    "Entretien réalisé selon la réglementation en vigueur. Réglages effectués, attestation d'entretien transmise au client.",
};

const HORIZON_REPORT =
  "Installation en bon état général.\nDeux filtres remplacés.\nAucune anomalie supplémentaire détectée.";

/** Signature manuscrite fictive (SVG) pour les interventions déjà clôturées. */
function demoSignature(seed: number): string {
  const a = 10 + (seed % 7) * 3;
  const b = 18 + (seed % 5) * 4;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100"><path d="M20 ${60 + (seed % 4)} C ${40 + a} 10, ${60 + b} 90, 90 50 S 130 ${20 + a}, 150 55 S 190 80, 210 ${40 + (seed % 9)} S 250 30, 280 52" fill="none" stroke="#021448" stroke-width="3" stroke-linecap="round"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function checklistFor(seed: InterventionSeed, doneCount: number): ChecklistItem[] {
  return DEFAULT_CHECKLISTS[seed.type].map((label, i) => ({
    id: `chk-${seed.ref}-${i}`,
    label,
    done: i < doneCount,
  }));
}

const PHOTO_LABELS: Record<Intervention["type"], string[]> = {
  maintenance: ["Unité extérieure", "Filtres avant remplacement", "Tableau de commande", "Unité intérieure"],
  installation: ["Avant travaux", "Raccordements", "Tableau après pose", "Mise en service"],
  depannage: ["Constat de panne", "Pièce défectueuse", "Après réparation"],
  entretien: ["Vue générale", "Mesures", "Après entretien"],
};
const TONES: Photo["tone"][] = ["blue", "navy", "cyan", "slate"];

function photosFor(seed: InterventionSeed, count: number, startTime: string): Photo[] {
  return PHOTO_LABELS[seed.type].slice(0, count).map((label, i) => ({
    id: `pho-${seed.ref}-${i}`,
    label,
    tone: TONES[i % TONES.length],
    takenAt: addMinutesToTime(startTime, 20 + i * 6),
  }));
}

function buildIntervention(seed: InterventionSeed, today: ISODate, scenario: Scenario): Intervention {
  const date = seed.day === null ? null : addBusinessDays(today, seed.day);
  const status = seed.status ?? (seed.day === null ? "A_PLANIFIER" : seed.day < 0 ? "TERMINEE" : "PLANIFIEE");
  const client = CLIENT_SEEDS.find((c) => c.id === seed.clientId)!;
  const createdDate = addDays(date ?? today, -(5 + (seed.ref % 9)));
  const base: Intervention = {
    id: interventionRef(seed.ref),
    clientId: seed.clientId,
    type: seed.type,
    title: seed.title,
    description: seed.description,
    address: `${client.address}, ${client.city}`,
    date,
    time: seed.time,
    durationMin: seed.duration,
    technicianId: seed.tech ? `tech-${seed.tech}` : null,
    status,
    priority: seed.priority ?? "NORMALE",
    amount: seed.amount,
    checklist: checklistFor(seed, 0),
    timeline: [{ id: `tl-${seed.ref}-0`, time: "09:12", label: "Demande enregistrée par Sophie Laurent", kind: "created" }],
    photos: [],
    report: "",
    signature: null,
    createdAt: `${createdDate}T09:12:00`,
  };

  if (status !== "A_PLANIFIER" && seed.time) {
    base.timeline.push({ id: `tl-${seed.ref}-1`, time: "09:20", label: "Intervention planifiée et technicien notifié", kind: "scheduled" });
  }

  if (status === "TERMINEE" && seed.time) {
    const t = seed.time;
    const end = addMinutesToTime(t, seed.duration);
    base.checklist = checklistFor(seed, 5);
    base.photos = photosFor(seed, 3, t);
    base.report = REPORTS[seed.type];
    base.signature = { dataUrl: demoSignature(seed.ref), signedBy: client.contactName, signedAt: `${date}T${end}:00` };
    base.timeline.push(
      { id: `tl-${seed.ref}-2`, time: addMinutesToTime(t, -6), label: "Technicien arrivé sur site", kind: "arrived" },
      { id: `tl-${seed.ref}-3`, time: t, label: "Intervention commencée", kind: "started" },
      { id: `tl-${seed.ref}-4`, time: addMinutesToTime(t, 25), label: "Photos ajoutées", kind: "photo" },
      { id: `tl-${seed.ref}-5`, time: addMinutesToTime(end, -4), label: `Rapport signé par ${client.contactName}`, kind: "signature" },
      { id: `tl-${seed.ref}-6`, time: end, label: "Intervention terminée", kind: "completed" },
    );
  }

  if (status === "ANNULEE") {
    base.timeline.push({ id: `tl-${seed.ref}-2`, time: "17:40", label: "Intervention annulée à la demande du client", kind: "cancelled" });
  }

  // INT-2026-046 : en cours chez la pharmacie, 4 photos déjà prises.
  if (seed.ref === 46) {
    base.checklist = checklistFor(seed, 2);
    base.photos = photosFor({ ...seed, type: "maintenance" }, 4, "13:30").map((p, i) => ({
      ...p,
      label: ["Ancien tableau", "Repérage des circuits", "Nouveau coffret", "Protections 30 mA"][i],
    }));
    base.timeline.push(
      { id: "tl-46-2", time: "13:24", label: "Technicien arrivé sur site (jour 1)", kind: "arrived" },
      { id: "tl-46-3", time: "13:31", label: "Chantier commencé", kind: "started" },
      { id: "tl-46-4", time: "17:45", label: "Fin de journée — reprise le lendemain à 8 h", kind: "report" },
      { id: "tl-46-5", time: "08:05", label: "Reprise du chantier (jour 2)", kind: "started" },
      { id: "tl-46-6", time: "09:10", label: "4 photos ajoutées", kind: "photo" },
    );
  }

  // INT-2026-042 : intervention phare de la démonstration.
  if (seed.ref === 42) {
    base.report = HORIZON_REPORT;
    if (scenario === "standard") {
      base.checklist = checklistFor(seed, 3);
      base.photos = photosFor(seed, 4, "08:30").map((p, i) => ({ ...p, takenAt: ["09:12", "09:13", "09:15", "09:15"][i] }));
      base.timeline.push(
        { id: "tl-42-2", time: "08:24", label: "Technicien arrivé sur site", kind: "arrived" },
        { id: "tl-42-3", time: "08:32", label: "Intervention commencée", kind: "started" },
        { id: "tl-42-4", time: "08:48", label: "Diagnostic effectué", kind: "diagnostic" },
        { id: "tl-42-5", time: "09:15", label: "Photos ajoutées", kind: "photo" },
      );
    } else {
      // Scénario « mode démo » : l'intervention sera démarrée depuis la vue technicien.
      base.status = "PLANIFIEE";
    }
  }

  return base;
}

const QUOTE_SEEDS: [number, string, string, number, QuoteStatus, number][] = [
  [8, "cli-rivage", "Climatisation chambres 12 à 18", 4200, "ACCEPTE", -48],
  [9, "cli-garage", "Compresseur à vis 500 L et réseau d'air", 2100, "ACCEPTE", -44],
  [10, "cli-atelier-central", "Ligne triphasée machine CNC", 2980, "ACCEPTE", -41],
  [11, "cli-agora", "Éclairage scénique LED et console DMX", 2650, "ACCEPTE", -37],
  [12, "cli-chenes", "Borne de recharge 22 kW", 1890, "ACCEPTE", -33],
  [13, "cli-logistique", "Éclairage LED entrepôt", 3850, "ACCEPTE", -30],
  [14, "cli-horizon", "Contrat de maintenance CVC annuel", 1680, "ACCEPTE", -28],
  [15, "cli-boulangerie", "Remplacement du four à sole", 6900, "REFUSE", -26],
  [16, "cli-ecole", "Mise à niveau éclairage de sécurité", 520, "ACCEPTE", -24],
  [17, "cli-hotel", "Contrat d'entretien VMC", 1240, "ACCEPTE", -21],
  [18, "cli-horizon", "Éclairage LED open space", 2450, "ACCEPTE", -16],
  [19, "cli-nova", "Câblage réseau et prises open space", 1850, "EN_ATTENTE", -9],
  [20, "cli-atelier-central", "Système d'aspiration centralisé", 3200, "EN_ATTENTE", -8],
  [21, "cli-rivage", "Radiateurs connectés à inertie", 2350, "ACCEPTE", -14],
  [22, "cli-marche", "Éclairage LED surface de vente", 4250, "EN_ATTENTE", -6],
  [23, "cli-clinique", "Remplacement groupe froid bloc technique", 5600, "EN_ATTENTE", -4],
  [24, "cli-quartz", "Alarme et contrôle d'accès", 1750, "ACCEPTE", -12],
  [25, "cli-horizon", "Remplacement CTA bâtiment B", 3550, "EN_ATTENTE", -2],
  [26, "cli-forme", "Ballon thermodynamique vestiaires", 2900, "REFUSE", -19],
];

function buildQuote([n, clientId, title, amount, status, offset]: (typeof QUOTE_SEEDS)[number], today: ISODate): Quote {
  const labour = Math.round((amount * 0.35) / 65) * 65;
  const issuedAt = addDays(today, offset);
  return {
    id: quoteRef(n),
    clientId,
    title,
    amount,
    status,
    issuedAt,
    validUntil: addDays(issuedAt, 30),
    lines: [
      { label: `Fournitures — ${title.toLowerCase()}`, quantity: 1, unitPrice: amount - labour - 90 },
      { label: "Main d'œuvre (taux horaire 65 € HT)", quantity: labour / 65, unitPrice: 65 },
      { label: "Déplacement et mise en service", quantity: 1, unitPrice: 90 },
    ],
  };
}

function buildInvoices(interventions: Intervention[], today: ISODate): Invoice[] {
  const done = interventions
    .filter((i) => i.status === "TERMINEE" && i.amount > 0 && i.date)
    .sort((a, b) => (a.date! < b.date! ? -1 : 1));
  return done.map((i, idx) => {
    const issuedAt = i.date!;
    const dueAt = addDays(issuedAt, 30);
    const ageDays = (new Date(today).getTime() - new Date(issuedAt).getTime()) / 86400000;
    const status = idx === 1 ? "EN_RETARD" : ageDays > 12 ? "PAYEE" : "EN_ATTENTE";
    return { id: invoiceRef(31 + idx), clientId: i.clientId, interventionId: i.id, amount: i.amount, status, issuedAt, dueAt };
  });
}

function buildDocuments(interventions: Intervention[], quotes: Quote[], invoices: Invoice[], today: ISODate): AppDocument[] {
  const docs: AppDocument[] = [
    { id: "doc-c1", name: "Contrat de maintenance CVC 2026 — Entreprise Horizon.pdf", type: "contrat", clientId: "cli-horizon", sizeKb: 412, date: addDays(today, -60), author: "Alexandre Rousset" },
    { id: "doc-c2", name: "Contrat d'entretien VMC — Hôtel Le Belvédère.pdf", type: "contrat", clientId: "cli-hotel", sizeKb: 386, date: addDays(today, -20), author: "Alexandre Rousset" },
    { id: "doc-a1", name: "Attestation de conformité électrique — Pharmacie des Tilleuls.pdf", type: "attestation", clientId: "cli-pharmacie", sizeKb: 228, date: addDays(today, -13), author: "Julien Morel" },
    { id: "doc-a2", name: "Attestation d'entretien chaudière — Crèche Les Petits Pas.pdf", type: "attestation", clientId: "cli-creche", sizeKb: 174, date: addDays(today, -1), author: "Lucas Martin" },
    { id: "doc-p1", name: "Plan d'implantation prises open space — Cabinet Nova.pdf", type: "plan", clientId: "cli-nova", sizeKb: 1840, date: addDays(today, -9), author: "Julien Morel" },
    { id: "doc-p2", name: "Schéma unifilaire TGBT — Atelier Central.pdf", type: "plan", clientId: "cli-atelier-central", sizeKb: 2310, date: addDays(today, -25), author: "Julien Morel" },
    { id: "doc-ph1", name: "Photos chantier éclairage — Logistique Delta Sud.zip", type: "photo", clientId: "cli-logistique", sizeKb: 18450, date: addDays(today, -2), author: "Lucas Martin" },
    { id: "doc-ph2", name: "Relevé photo chaufferie — Résidence Bellevue.zip", type: "photo", clientId: "cli-bellevue", sizeKb: 9620, date: addDays(today, -10), author: "Lucas Martin" },
  ];
  interventions
    .filter((i) => i.status === "TERMINEE" && i.date)
    .forEach((i) => {
      const tech = TEAM.find((m) => m.id === i.technicianId);
      docs.push({
        id: `doc-r-${i.id}`,
        name: `Rapport d'intervention ${i.id}.pdf`,
        type: "rapport",
        clientId: i.clientId,
        interventionId: i.id,
        sizeKb: 240 + (Number(i.id.slice(-2)) % 7) * 37,
        date: i.date!,
        author: tech ? `${tech.firstName} ${tech.lastName}` : "—",
      });
    });
  quotes.forEach((q) =>
    docs.push({ id: `doc-q-${q.id}`, name: `Devis ${q.id}.pdf`, type: "devis", clientId: q.clientId, sizeKb: 132 + (q.amount % 90), date: q.issuedAt, author: "Sophie Laurent" }),
  );
  invoices.slice(-8).forEach((f) =>
    docs.push({ id: `doc-f-${f.id}`, name: `Facture ${f.id}.pdf`, type: "facture", clientId: f.clientId, interventionId: f.interventionId, sizeKb: 98 + (f.amount % 60), date: f.issuedAt, author: "Sophie Laurent" }),
  );
  return docs.sort((a, b) => (a.date < b.date ? 1 : -1));
}

function buildActivities(now: Date): Activity[] {
  const ago = (minutes: number) => toISODateTime(new Date(now.getTime() - minutes * 60000));
  return [
    { id: "act-1", kind: "intervention_done", text: "Intervention INT-2026-047 terminée — Boulangerie Maison Fournier", at: ago(14), href: "/interventions/INT-2026-047" },
    { id: "act-2", kind: "photos", text: "4 photos ajoutées — INT-2026-046 · Pharmacie des Tilleuls", at: ago(38), href: "/interventions/INT-2026-046" },
    { id: "act-3", kind: "signature", text: "Rapport signé par le client — Groupe Rivage", at: ago(95), href: "/interventions/INT-2026-041" },
    { id: "act-4", kind: "quote_accepted", text: "Devis DEV-2026-018 accepté — Entreprise Horizon", at: ago(180), href: "/devis" },
    { id: "act-5", kind: "client_new", text: "Nouveau client ajouté — Crèche Les Petits Pas", at: ago(60 * 26), href: "/clients/cli-creche" },
    { id: "act-6", kind: "intervention_created", text: "Intervention INT-2026-061 planifiée — Agence immobilière Quartz", at: ago(60 * 28), href: "/interventions/INT-2026-061" },
  ];
}

/**
 * Génère l'ensemble des données de démonstration, ancrées sur la date du jour.
 * Fonction pure : un même jour + un même scénario produisent les mêmes données.
 */
export function createSeedData(today: ISODate, scenario: Scenario = "standard", now: Date = new Date()): AppData {
  const interventions = INTERVENTION_SEEDS.map((s) => buildIntervention(s, today, scenario));
  const clients = CLIENT_SEEDS.map(({ totalInterventions, ...c }) => ({
    ...c,
    pastInterventions: Math.max(0, totalInterventions - interventions.filter((i) => i.clientId === c.id).length),
  }));
  const quotes = QUOTE_SEEDS.map((q) => buildQuote(q, today));
  const invoices = buildInvoices(interventions, today);
  return {
    version: DATA_VERSION,
    seededOn: today,
    scenario,
    clients,
    interventions,
    team: TEAM,
    quotes,
    invoices,
    documents: buildDocuments(interventions, quotes, invoices, today),
    activities: buildActivities(now),
    settings: DEFAULT_SETTINGS,
  };
}
