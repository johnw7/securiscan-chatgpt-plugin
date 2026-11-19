import { DEFAULT_SCORING, type Question } from "./scoring.ts";

/**
 * Modèle d'audit de sûreté par défaut (paramétrable dans l'application).
 * Les questions sont des points de contrôle génériques de bonnes pratiques.
 */
export const DEFAULT_CATEGORIES = [
  { key: "controle_acces", label: "Contrôle d'accès" },
  { key: "protection_perimetrique", label: "Protection périmétrique" },
  { key: "videoprotection", label: "Vidéoprotection" },
  { key: "detection_intrusion", label: "Détection intrusion" },
  { key: "organisation_procedures", label: "Organisation et procédures" },
  { key: "gestion_visiteurs", label: "Gestion des visiteurs" },
  { key: "protection_actifs", label: "Protection des actifs" },
  { key: "continuite_activite", label: "Continuité d'activité" },
];

const q = (category: string, n: number, label: string, guidance?: string): Question => ({
  id: `${category}-${n}`,
  category,
  label,
  guidance,
  weight: 1,
});

export const DEFAULT_QUESTIONS: Question[] = [
  q("controle_acces", 1, "Les accès au site sont-ils identifiés, limités en nombre et maîtrisés ?"),
  q("controle_acces", 2, "Les droits d'accès sont-ils attribués nominativement et revus périodiquement ?"),
  q("controle_acces", 3, "Les badges, clés et codes perdus ou restitués sont-ils désactivés sans délai ?"),
  q("controle_acces", 4, "Les zones sensibles disposent-elles d'un contrôle d'accès renforcé ?"),
  q("protection_perimetrique", 1, "La limite de propriété est-elle matérialisée et en bon état ?"),
  q("protection_perimetrique", 2, "Les portails et accès véhicules sont-ils fermés hors des heures d'activité ?"),
  q("protection_perimetrique", 3, "L'éclairage extérieur couvre-t-il les points d'accès et zones sensibles ?"),
  q("protection_perimetrique", 4, "La végétation ou le mobilier extérieur ne facilitent-ils pas une intrusion ?"),
  q("videoprotection", 1, "Les caméras couvrent-elles les accès et zones à enjeux définis ?"),
  q("videoprotection", 2, "La qualité d'image permet-elle l'exploitation (identification, levée de doute) ?"),
  q("videoprotection", 3, "La durée de conservation et l'information du public sont-elles conformes ?", "Durée proportionnée, affichage, registre de traitement."),
  q("videoprotection", 4, "L'enregistreur et les accès aux images sont-ils protégés ?"),
  q("detection_intrusion", 1, "Un système de détection intrusion couvre-t-il les accès et volumes sensibles ?"),
  q("detection_intrusion", 2, "Les alarmes sont-elles transmises et traitées (télésurveillance, astreinte) ?"),
  q("detection_intrusion", 3, "Le système est-il maintenu et testé régulièrement ?"),
  q("organisation_procedures", 1, "Un référent sûreté est-il désigné et connu du personnel ?"),
  q("organisation_procedures", 2, "Des consignes écrites existent-elles (ouverture, fermeture, incident) ?"),
  q("organisation_procedures", 3, "Le personnel est-il sensibilisé aux risques et aux réflexes attendus ?"),
  q("organisation_procedures", 4, "Les incidents sont-ils consignés et analysés ?"),
  q("gestion_visiteurs", 1, "Les visiteurs sont-ils enregistrés et identifiés à leur arrivée ?"),
  q("gestion_visiteurs", 2, "Les visiteurs sont-ils accompagnés dans les zones non publiques ?"),
  q("gestion_visiteurs", 3, "Les prestataires et livraisons font-ils l'objet d'une procédure ?"),
  q("protection_actifs", 1, "Les biens de valeur et fonds sont-ils protégés (coffre, local fermé) ?"),
  q("protection_actifs", 2, "Les informations et équipements informatiques sensibles sont-ils protégés ?"),
  q("protection_actifs", 3, "Un inventaire des actifs sensibles est-il tenu à jour ?"),
  q("continuite_activite", 1, "Les scénarios de crise majeurs ont-ils été identifiés ?"),
  q("continuite_activite", 2, "Un plan de continuité ou de reprise existe-t-il et est-il connu ?"),
  q("continuite_activite", 3, "Les contacts d'urgence et la chaîne d'alerte sont-ils à jour ?"),
  q("continuite_activite", 4, "Des exercices sont-ils organisés et suivis d'un retour d'expérience ?"),
];

export const DEFAULT_TEMPLATE = {
  name: "Audit de sûreté — modèle général NOAMIS",
  description: "Grille d'observation couvrant les 8 domaines de la sûreté d'un site. À adapter selon le contexte.",
  categories: DEFAULT_CATEGORIES,
  questions: DEFAULT_QUESTIONS,
  scoring: DEFAULT_SCORING,
};

export const DEFAULT_METHODOLOGY = `L'audit a été conduit selon la démarche NOAMIS : entretien de cadrage, visite du site, observation des dispositifs existants, analyse documentaire, puis évaluation des risques selon une matrice vraisemblance × gravité.

Les constats reflètent la situation observée à la date de la visite. Les cotations sont établies sur la base des éléments disponibles et validées par le consultant NOAMIS. Les recommandations sont hiérarchisées par priorité (P1 à P4) ; leur mise en œuvre relève du client et des prestataires qu'il choisit.`;
