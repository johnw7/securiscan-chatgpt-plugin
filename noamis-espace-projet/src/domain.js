'use strict';
// Référentiels métier NOAMIS : méthode, niveaux d'accompagnement, livrables, libellés.

const STEPS = [
  { n: 1, key: 'comprendre', label: 'Comprendre', desc: 'Contexte, besoins, contraintes et objectifs.' },
  { n: 2, key: 'preparer', label: 'Préparer', desc: 'Cahier des besoins, dossier projet et feuille de route.' },
  { n: 3, key: 'rechercher', label: 'Rechercher', desc: 'Professionnels consultés, devis et aide à la décision.' },
  { n: 4, key: 'accompagner', label: 'Accompagner', desc: 'Planning, échanges et suivi des actions convenues.' },
  { n: 5, key: 'finaliser', label: 'Finaliser', desc: 'Synthèse, documents utiles et clôture du dossier.' },
];
const stepLabel = (n) => (STEPS.find((s) => s.n === Number(n)) || { label: '—' }).label;

const DELIVERABLES = [
  { key: 'fiche-besoin', step: 1, label: 'Fiche de compréhension du besoin' },
  { key: 'note-conseil', step: 2, label: 'Note de conseil personnalisée' },
  { key: 'cahier-besoins', step: 2, label: 'Cahier des besoins' },
  { key: 'dossier-projet', step: 2, label: 'Dossier Projet NOAMIS' },
  { key: 'feuille-route', step: 2, label: 'Feuille de route' },
  { key: 'liste-professionnels', step: 3, label: 'Liste des professionnels consultés' },
  { key: 'comparatif', step: 3, label: 'Comparatif des propositions' },
  { key: 'aide-decision', step: 3, label: 'Note d’aide à la décision' },
  { key: 'planning', step: 4, label: 'Planning de suivi' },
  { key: 'tableau-suivi', step: 4, label: 'Tableau de suivi des actions' },
  { key: 'comptes-rendus', step: 4, label: 'Comptes rendus' },
  { key: 'synthese', step: 5, label: 'Synthèse de fin de mission' },
  { key: 'dossier-cloture', step: 5, label: 'Dossier de clôture' },
];

const LEVELS = {
  conseil: {
    label: 'NOAMIS CONSEIL',
    desc: 'Analyse du besoin et note de conseil personnalisée.',
    steps: [1, 2, 5],
    deliverables: ['fiche-besoin', 'note-conseil', 'synthese'],
  },
  projet: {
    label: 'NOAMIS PROJET',
    desc: 'Préparation du dossier, consultation des professionnels et comparaison des propositions.',
    steps: [1, 2, 3, 5],
    deliverables: ['fiche-besoin', 'cahier-besoins', 'dossier-projet', 'liste-professionnels', 'comparatif', 'aide-decision', 'synthese'],
  },
  integral: {
    label: 'NOAMIS ACCOMPAGNEMENT INTÉGRAL',
    desc: 'Préparation et suivi organisationnel jusqu’à la clôture, dans le périmètre convenu avec le client.',
    steps: [1, 2, 3, 4, 5],
    deliverables: ['fiche-besoin', 'cahier-besoins', 'dossier-projet', 'feuille-route', 'liste-professionnels', 'comparatif', 'aide-decision', 'planning', 'tableau-suivi', 'comptes-rendus', 'synthese', 'dossier-cloture'],
  },
};
const levelLabel = (k) => (LEVELS[k] ? LEVELS[k].label : 'Non défini');

const PROFILES = ['Particulier', 'Commerce', 'Entreprise', 'Dirigeant', 'Personnalité', 'Autre'];
const CONTACT_PREFS = ['E-mail', 'Téléphone', 'Indifférent'];
const NEEDS = [
  'Sécurisation d’une résidence',
  'Sécurisation d’un commerce',
  'Sûreté d’une entreprise ou d’un site',
  'Protection d’un dirigeant ou d’une personnalité',
  'Organisation d’un événement',
  'Conseil ponctuel ou second avis',
  'Autre besoin',
];
const TIMELINES = ['Dès que possible', 'Sous un mois', 'Entre un et trois mois', 'Plus de trois mois', 'Pas encore défini'];

// Chaque statut associe une icône ET un libellé explicite (la couleur ne porte jamais l'information seule).
const REQUEST_STATUS = {
  nouvelle: { label: 'Nouvelle demande', icon: 'inbox' },
  en_examen: { label: 'En cours d’examen', icon: 'clock' },
  convertie: { label: 'Dossier créé', icon: 'check' },
  classee: { label: 'Classée sans suite', icon: 'archive' },
};
const STEP_STATUS = {
  a_venir: { label: 'À venir', icon: 'circle' },
  en_cours: { label: 'En cours', icon: 'progress' },
  terminee: { label: 'Terminée', icon: 'check' },
};
const DELIVERABLE_STATUS = {
  prevu: { label: 'Prévu', icon: 'circle' },
  en_cours: { label: 'En préparation', icon: 'progress' },
  remis: { label: 'Remis', icon: 'check' },
};
const VALIDATION_STATUS = {
  en_attente: { label: 'À valider', icon: 'clock' },
  valide: { label: 'Validé', icon: 'check' },
  modification: { label: 'Modification demandée', icon: 'edit' },
  refuse: { label: 'Refusé', icon: 'x' },
  remplacee: { label: 'Remplacée par une nouvelle version', icon: 'refresh' },
};
const DOSSIER_STATUS = {
  ouvert: { label: 'Dossier ouvert', icon: 'folder' },
  clos: { label: 'Dossier clôturé', icon: 'lock' },
};
const TASK_STATUS = {
  a_faire: { label: 'À faire', icon: 'circle' },
  fait: { label: 'Fait', icon: 'check' },
};

module.exports = {
  STEPS, stepLabel, DELIVERABLES, LEVELS, levelLabel, PROFILES, CONTACT_PREFS, NEEDS, TIMELINES,
  REQUEST_STATUS, STEP_STATUS, DELIVERABLE_STATUS, VALIDATION_STATUS, DOSSIER_STATUS, TASK_STATUS,
};
