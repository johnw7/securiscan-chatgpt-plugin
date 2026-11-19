/**
 * Libellés français et tonalités visuelles des énumérations métier.
 * Les clés correspondent aux contraintes CHECK des migrations SQL.
 */
export type Tone = "neutral" | "gold" | "success" | "warning" | "danger" | "info";
type LabelMap = Record<string, { label: string; tone: Tone }>;

const l = (label: string, tone: Tone = "neutral") => ({ label, tone });

export const CLIENT_CATEGORIES: LabelMap = {
  particulier: l("Particulier"),
  commerce: l("Commerce"),
  entreprise: l("Entreprise"),
  dirigeant: l("Dirigeant"),
  vip: l("VIP / personnalité exposée", "gold"),
  collectivite: l("Collectivité"),
};

export const CLIENT_STATUS: LabelMap = {
  prospect: l("Prospect", "info"),
  actif: l("Actif", "success"),
  inactif: l("Inactif"),
};

export const LEAD_STAGES: LabelMap = {
  nouveau: l("Nouveau", "info"),
  qualifie: l("Qualifié", "gold"),
  proposition: l("Proposition", "gold"),
  negociation: l("Négociation", "warning"),
  gagne: l("Gagné", "success"),
  perdu: l("Perdu", "danger"),
};
export const LEAD_STAGE_ORDER = ["nouveau", "qualifie", "proposition", "negociation", "gagne", "perdu"] as const;

export const LEAD_SOURCES: LabelMap = {
  protect: l("Diagnostic PROTECT", "gold"),
  site: l("Site internet"),
  recommandation: l("Recommandation"),
  reseau: l("Réseau"),
  salon: l("Salon / événement"),
  autre: l("Autre"),
};

/** Prestations NOAMIS (vérifiées sur noamis.fr/accompagnements). */
export const SERVICE_TYPES: LabelMap = {
  audit_surete: l("Conseil et audit de sûreté"),
  amoa: l("Assistance à maîtrise d'ouvrage (AMOA)"),
  risk_intelligence: l("Risk Intelligence et veille"),
  solutions_securite: l("Conseil en solutions de sécurité"),
  pilotage_projet: l("Pilotage et coordination de projets"),
  gestion_crise: l("Prévention et gestion de crise"),
  prevention_cambriolage: l("Prévention cambriolage & home-jacking"),
  autre: l("Autre prestation"),
};

export const MISSION_STATUS: LabelMap = {
  brouillon: l("Brouillon"),
  planifiee: l("Planifiée", "info"),
  en_cours: l("En cours", "gold"),
  en_pause: l("En pause", "warning"),
  terminee: l("Terminée", "success"),
  annulee: l("Annulée", "danger"),
};

export const TASK_STATUS: LabelMap = {
  a_faire: l("À faire", "info"),
  en_cours: l("En cours", "gold"),
  terminee: l("Terminée", "success"),
  annulee: l("Annulée"),
};

export const TASK_PRIORITY: LabelMap = {
  basse: l("Basse"),
  normale: l("Normale", "info"),
  haute: l("Haute", "warning"),
  critique: l("Critique", "danger"),
};

export const EVENT_KINDS: LabelMap = {
  rendez_vous: l("Rendez-vous", "gold"),
  visite_site: l("Visite de site", "info"),
  reunion: l("Réunion"),
  echeance: l("Échéance", "warning"),
  interne: l("Interne"),
};

export const AUDIT_STATUS: LabelMap = {
  brouillon: l("Brouillon"),
  en_cours: l("En cours", "gold"),
  en_revue: l("En revue", "warning"),
  valide: l("Validé", "success"),
  archive: l("Archivé"),
};

/** Catégories d'audit demandées au cahier des charges. */
export const AUDIT_CATEGORIES: LabelMap = {
  controle_acces: l("Contrôle d'accès"),
  protection_perimetrique: l("Protection périmétrique"),
  videoprotection: l("Vidéoprotection"),
  detection_intrusion: l("Détection intrusion"),
  organisation_procedures: l("Organisation et procédures"),
  gestion_visiteurs: l("Gestion des visiteurs"),
  protection_actifs: l("Protection des actifs"),
  continuite_activite: l("Continuité d'activité"),
};

export const RECO_PRIORITY: LabelMap = {
  P1: l("P1 — Urgent", "danger"),
  P2: l("P2 — Prioritaire", "warning"),
  P3: l("P3 — Recommandé", "gold"),
  P4: l("P4 — Amélioration", "info"),
};

export const RECO_STATUS: LabelMap = {
  proposee: l("Proposée", "info"),
  acceptee: l("Acceptée", "gold"),
  en_cours: l("En cours", "warning"),
  realisee: l("Réalisée", "success"),
  rejetee: l("Rejetée"),
};

export const RECO_HORIZON: LabelMap = {
  immediat: l("Immédiat"),
  "3_mois": l("Sous 3 mois"),
  "6_mois": l("Sous 6 mois"),
  "12_mois": l("Sous 12 mois"),
  long_terme: l("Long terme"),
};

/** Méthode AMOA NOAMIS en 8 étapes (noamis.fr/methode) + clôture. */
export const PROJECT_PHASES: LabelMap = {
  cadrage: l("1. Écoute et cadrage"),
  analyse_risques: l("2. Analyse des risques"),
  orientations: l("3. Orientations et recommandations"),
  cahier_des_charges: l("4. Formalisation des besoins"),
  consultation: l("5. Consultation des professionnels"),
  analyse_offres: l("5 bis. Analyse des offres"),
  suivi_execution: l("6. Suivi et coordination"),
  reception: l("7. Assistance à la réception"),
  cloture: l("8. Clôture et transfert documentaire"),
};
export const PROJECT_PHASE_ORDER = Object.keys(PROJECT_PHASES);

export const PROJECT_STATUS: LabelMap = {
  actif: l("Actif", "gold"),
  en_pause: l("En pause", "warning"),
  clos: l("Clos", "success"),
  abandonne: l("Abandonné", "danger"),
};

export const MILESTONE_STATUS: LabelMap = {
  a_venir: l("À venir", "info"),
  en_cours: l("En cours", "gold"),
  atteint: l("Atteint", "success"),
  en_retard: l("En retard", "danger"),
  annule: l("Annulé"),
};

export const DECISION_KINDS: LabelMap = {
  decision: l("Décision", "gold"),
  action_corrective: l("Action corrective", "warning"),
  reserve: l("Réserve", "danger"),
};

export const DECISION_STATUS: LabelMap = {
  ouverte: l("Ouverte", "warning"),
  en_cours: l("En cours", "gold"),
  levee: l("Levée", "success"),
  close: l("Close", "success"),
};

export const SOURCE_KINDS: LabelMap = {
  institutionnel: l("Institutionnel"),
  presse: l("Presse"),
  specialise: l("Spécialisé"),
  flux_rss: l("Flux RSS"),
  reseau: l("Réseau professionnel"),
  autre: l("Autre"),
};

/** Code de l'Amirauté (fiabilité de la source). */
export const RELIABILITY: LabelMap = {
  A: l("A — Totalement fiable", "success"),
  B: l("B — Habituellement fiable", "success"),
  C: l("C — Assez fiable", "gold"),
  D: l("D — Pas toujours fiable", "warning"),
  E: l("E — Peu fiable", "danger"),
  F: l("F — Fiabilité non évaluable"),
};

export const CREDIBILITY: Record<number, string> = {
  1: "1 — Confirmée par d'autres sources",
  2: "2 — Probablement vraie",
  3: "3 — Possiblement vraie",
  4: "4 — Douteuse",
  5: "5 — Improbable",
  6: "6 — Véracité non évaluable",
};

export const REPORT_KINDS: LabelMap = {
  fiche: l("Fiche de veille"),
  bulletin: l("Bulletin", "info"),
  alerte: l("Alerte", "danger"),
};

export const REPORT_STATUS: LabelMap = {
  brouillon: l("Brouillon"),
  en_revue: l("En revue", "warning"),
  valide: l("Validé", "success"),
  diffuse: l("Diffusé", "gold"),
  archive: l("Archivé"),
};

export const SEVERITY: LabelMap = {
  information: l("Information", "info"),
  vigilance: l("Vigilance", "warning"),
  alerte: l("Alerte", "danger"),
};

export const ITEM_STATUS: LabelMap = {
  nouveau: l("Nouveau", "info"),
  retenu: l("Retenu", "gold"),
  ecarte: l("Écarté"),
  archive: l("Archivé"),
};

export const QUOTE_STATUS: LabelMap = {
  brouillon: l("Brouillon"),
  envoye: l("Envoyé", "info"),
  accepte: l("Accepté", "success"),
  refuse: l("Refusé", "danger"),
  expire: l("Expiré", "warning"),
  converti: l("Facturé", "gold"),
};

export const INVOICE_STATUS: LabelMap = {
  brouillon: l("Brouillon"),
  emise: l("Émise", "info"),
  partiellement_payee: l("Partiellement payée", "warning"),
  payee: l("Payée", "success"),
  annulee: l("Annulée (avoir)", "danger"),
};

export const PAYMENT_METHODS: LabelMap = {
  virement: l("Virement"),
  cheque: l("Chèque"),
  carte: l("Carte bancaire"),
  especes: l("Espèces"),
  prelevement: l("Prélèvement"),
  autre: l("Autre"),
};

export const DOC_CATEGORIES: LabelMap = {
  rapport_audit: l("Rapport d'audit", "danger"),
  livrable: l("Livrable", "gold"),
  cahier_des_charges: l("Cahier des charges"),
  devis_prestataire: l("Devis prestataire"),
  compte_rendu: l("Compte rendu"),
  contrat: l("Contrat"),
  facture: l("Facture"),
  plan: l("Plan"),
  photo: l("Photo"),
  veille: l("Veille"),
  piece_client: l("Pièce client", "info"),
  autre: l("Autre"),
};

export const CONFIDENTIALITY: LabelMap = {
  interne: l("Interne NOAMIS", "neutral"),
  client: l("Partagé avec le client", "gold"),
  restreint: l("Restreint", "danger"),
};

export const APPROVAL_STATUS: LabelMap = {
  en_attente: l("En attente", "warning"),
  approuve: l("Approuvé", "success"),
  refuse: l("Refusé", "danger"),
};

export const VAT_RATES = [0, 2.1, 5.5, 10, 20] as const;

export function labelOf(map: LabelMap, key: string | null | undefined): string {
  if (!key) return "—";
  return map[key]?.label ?? key;
}

export function optionsOf(map: LabelMap): Array<{ value: string; label: string }> {
  return Object.entries(map).map(([value, { label }]) => ({ value, label }));
}
