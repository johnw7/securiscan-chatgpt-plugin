import type { InterventionStatus, InterventionType, Priority } from "../types";

/**
 * Définitions compactes des interventions fictives.
 * `day` est un décalage en jours ouvrés par rapport à aujourd'hui
 * (`null` = intervention à planifier) : la démo reste toujours d'actualité.
 */
export interface InterventionSeed {
  ref: number;
  clientId: string;
  type: InterventionType;
  title: string;
  description: string;
  day: number | null;
  time: string | null;
  duration: number;
  tech: "thomas" | "julien" | "lucas" | null;
  amount: number;
  status?: InterventionStatus;
  priority?: Priority;
}

export const INTERVENTION_SEEDS: InterventionSeed[] = [
  // ——— Aujourd'hui ———
  {
    ref: 42, clientId: "cli-horizon", type: "maintenance", title: "Maintenance climatisation",
    description: "Contrôle annuel du système de climatisation et remplacement des filtres.",
    day: 0, time: "08:30", duration: 120, tech: "thomas", amount: 480, status: "EN_COURS",
  },
  {
    ref: 43, clientId: "cli-nova", type: "installation", title: "Installation électrique",
    description: "Création de 8 prises de courant et 6 prises RJ45 dans l'open space, pose d'un sous-tableau dédié.",
    day: 0, time: "10:00", duration: 180, tech: "julien", amount: 1250, status: "PLANIFIEE", priority: "IMPORTANTE",
  },
  {
    ref: 44, clientId: "cli-bellevue", type: "entretien", title: "Entretien annuel",
    description: "Entretien annuel de la chaudière collective, contrôle des organes de sécurité et relevé de combustion.",
    day: 0, time: "13:30", duration: 90, tech: "thomas", amount: 320, status: "PLANIFIEE",
  },
  {
    ref: 45, clientId: "cli-atelier21", type: "depannage", title: "Dépannage chambre froide",
    description: "Température anormale dans la chambre froide positive (8 °C relevés). Contrôle du groupe et du détendeur.",
    day: 0, time: "16:00", duration: 90, tech: "lucas", amount: 390, status: "PLANIFIEE", priority: "URGENTE",
  },
  {
    ref: 46, clientId: "cli-pharmacie", type: "installation", title: "Mise en conformité tableau électrique",
    description: "Chantier sur deux jours : remplacement du tableau principal, ajout de protections différentielles 30 mA et repérage des circuits.",
    day: -1, time: "13:30", duration: 480, tech: "julien", amount: 1680, status: "EN_COURS", priority: "IMPORTANTE",
  },
  {
    ref: 47, clientId: "cli-boulangerie", type: "depannage", title: "Dépannage four à sole",
    description: "Le four ne monte plus en température. Contrôle de l'alimentation triphasée et des résistances.",
    day: 0, time: "06:45", duration: 60, tech: "lucas", amount: 260, status: "TERMINEE", priority: "URGENTE",
  },
  {
    ref: 48, clientId: "cli-hotel", type: "maintenance", title: "Contrôle VMC double flux",
    description: "Contrôle des débits, nettoyage des bouches d'extraction et remplacement des filtres F7.",
    day: 0, time: "11:00", duration: 90, tech: "thomas", amount: 410, status: "PLANIFIEE",
  },
  {
    ref: 49, clientId: "cli-lilas", type: "entretien", title: "Entretien pompe à chaleur",
    description: "Entretien réglementaire de la PAC air/eau, contrôle d'étanchéité et nettoyage de l'unité extérieure.",
    day: 0, time: "15:30", duration: 60, tech: "thomas", amount: 240, status: "PLANIFIEE",
  },

  // ——— Historique récent ———
  { ref: 41, clientId: "cli-rivage", type: "maintenance", title: "Maintenance préventive climatisation hall", description: "Visite trimestrielle des cassettes du hall et du restaurant de l'hôtel.", day: -1, time: "09:00", duration: 150, tech: "thomas", amount: 620 },
  { ref: 40, clientId: "cli-garage", type: "depannage", title: "Dépannage pont élévateur", description: "Le pont n°2 disjoncte à la montée. Recherche de défaut sur le circuit de commande.", day: -3, time: "10:00", duration: 90, tech: "julien", amount: 340, priority: "URGENTE" },
  { ref: 39, clientId: "cli-creche", type: "entretien", title: "Entretien chaudière gaz", description: "Entretien annuel obligatoire et remise de l'attestation.", day: -1, time: "13:15", duration: 60, tech: "lucas", amount: 210 },
  { ref: 38, clientId: "cli-horizon", type: "depannage", title: "Dépannage éclairage parking", description: "Plusieurs luminaires du niveau -1 hors service. Remplacement des drivers LED.", day: -2, time: "08:30", duration: 75, tech: "julien", amount: 280 },
  { ref: 37, clientId: "cli-logistique", type: "installation", title: "Installation éclairage LED entrepôt", description: "Remplacement de 48 projecteurs sodium par des cloches LED avec détection de présence.", day: -2, time: "08:00", duration: 420, tech: "lucas", amount: 3850, priority: "IMPORTANTE" },
  { ref: 36, clientId: "cli-atelier-central", type: "maintenance", title: "Maintenance compresseur atelier", description: "Vidange, remplacement du séparateur d'huile et contrôle des soupapes.", day: -2, time: "14:00", duration: 120, tech: "thomas", amount: 540 },
  { ref: 35, clientId: "cli-forme", type: "entretien", title: "Entretien centrale de traitement d'air", description: "Nettoyage de la batterie, remplacement des courroies et des filtres.", day: -3, time: "09:30", duration: 120, tech: "thomas", amount: 460 },
  { ref: 34, clientId: "cli-quartz", type: "depannage", title: "Remplacement disjoncteur différentiel", description: "Déclenchements intempestifs dans l'agence. Remplacement de l'interrupteur différentiel type A.", day: -3, time: "15:00", duration: 45, tech: "julien", amount: 180 },
  { ref: 33, clientId: "cli-lumen", type: "maintenance", title: "Maintenance climatisation salle machines", description: "Contrôle des groupes de production de froid et des condensats.", day: -4, time: "08:30", duration: 150, tech: "thomas", amount: 690 },
  { ref: 32, clientId: "cli-chenes", type: "installation", title: "Installation borne de recharge", description: "Pose d'une borne 22 kW pour la clientèle des gîtes, avec protection dédiée.", day: -4, time: "13:00", duration: 240, tech: "julien", amount: 1890 },
  { ref: 31, clientId: "cli-hotel", type: "depannage", title: "Fuite réseau eau chaude sanitaire", description: "Fuite en faux plafond au 2e étage. Recherche et réparation de la canalisation.", day: -5, time: "07:45", duration: 90, tech: "lucas", amount: 360, priority: "URGENTE" },
  { ref: 30, clientId: "cli-ecole", type: "entretien", title: "Contrôle annuel éclairage de sécurité", description: "Essai des blocs autonomes et remplacement des blocs défaillants.", day: -5, time: "09:00", duration: 180, tech: "julien", amount: 520 },
  { ref: 29, clientId: "cli-horizon", type: "maintenance", title: "Remplacement thermostat salle de réunion", description: "Thermostat d'ambiance défectueux remplacé par un modèle programmable.", day: -6, time: "10:00", duration: 60, tech: "thomas", amount: 290 },
  { ref: 28, clientId: "cli-marche", type: "depannage", title: "Dépannage vitrine réfrigérée", description: "Vitrine produits frais en défaut haute pression. Nettoyage du condenseur et remplacement du ventilateur.", day: -6, time: "08:00", duration: 120, tech: "lucas", amount: 450, priority: "URGENTE" },
  { ref: 27, clientId: "cli-clinique", type: "maintenance", title: "Maintenance groupe froid bloc technique", description: "Maintenance semestrielle du groupe froid et relevé des pressions.", day: -7, time: "08:30", duration: 180, tech: "thomas", amount: 980, priority: "IMPORTANTE" },
  { ref: 26, clientId: "cli-jardins", type: "entretien", title: "Entretien VMC parties communes", description: "Nettoyage des caissons et contrôle des débits dans les gaines.", day: -7, time: "14:00", duration: 120, tech: "lucas", amount: 380 },
  { ref: 25, clientId: "cli-agora", type: "installation", title: "Installation éclairage scénique", description: "Alimentation de 12 projecteurs LED et pose d'une console de commande DMX.", day: -8, time: "09:00", duration: 360, tech: "julien", amount: 2650 },
  { ref: 24, clientId: "cli-lilas", type: "depannage", title: "Panne climatisation cabinet 2", description: "Le client a reporté l'intervention suite à la remise en route de l'appareil.", day: -8, time: "11:00", duration: 60, tech: "thomas", amount: 0, status: "ANNULEE" },
  { ref: 23, clientId: "cli-nova", type: "maintenance", title: "Contrôle installation électrique annuel", description: "Vérification des protections, serrage des connexions et thermographie du tableau.", day: -9, time: "09:00", duration: 120, tech: "julien", amount: 420 },
  { ref: 22, clientId: "cli-bellevue", type: "depannage", title: "Remplacement circulateur chaufferie", description: "Circulateur du circuit radiateurs bâtiment B hors service.", day: -10, time: "08:00", duration: 150, tech: "lucas", amount: 760, priority: "URGENTE" },
  { ref: 21, clientId: "cli-rivage", type: "installation", title: "Installation climatisation chambres 12 à 18", description: "Pose de 7 unités murales et d'un groupe extérieur DRV.", day: -11, time: "08:00", duration: 480, tech: "thomas", amount: 4200, priority: "IMPORTANTE" },
  { ref: 20, clientId: "cli-atelier21", type: "entretien", title: "Entretien hotte et extraction cuisine", description: "Dégraissage du caisson d'extraction et contrôle du moteur.", day: -12, time: "15:00", duration: 120, tech: "lucas", amount: 390 },
  { ref: 19, clientId: "cli-pharmacie", type: "maintenance", title: "Maintenance climatisation officine", description: "Nettoyage des unités intérieures et contrôle de la charge.", day: -13, time: "08:30", duration: 90, tech: "thomas", amount: 330 },
  { ref: 18, clientId: "cli-horizon", type: "entretien", title: "Entretien chaudière bâtiment B", description: "Entretien annuel et contrôle de combustion.", day: -14, time: "09:00", duration: 90, tech: "lucas", amount: 350 },
  { ref: 17, clientId: "cli-garage", type: "installation", title: "Installation compresseur 500 L", description: "Pose d'un compresseur à vis et création du réseau d'air comprimé.", day: -15, time: "08:00", duration: 300, tech: "julien", amount: 2100 },
  { ref: 16, clientId: "cli-boulangerie", type: "entretien", title: "Entretien chambre de pousse", description: "Intervention annulée à la demande du client (fermeture exceptionnelle).", day: -16, time: "14:00", duration: 60, tech: "lucas", amount: 0, status: "ANNULEE" },
  { ref: 15, clientId: "cli-atelier-central", type: "installation", title: "Création ligne triphasée machine CNC", description: "Tirage d'une ligne 63 A depuis le TGBT et pose d'un coffret de coupure d'urgence.", day: -18, time: "08:00", duration: 360, tech: "julien", amount: 2980 },

  // ——— À venir ———
  { ref: 50, clientId: "cli-atelier-central", type: "depannage", title: "Dépannage extracteur de copeaux", description: "Moteur de l'extracteur en surchauffe. Contrôle du moteur et des protections thermiques.", day: 1, time: "08:30", duration: 120, tech: "lucas", amount: 480, priority: "URGENTE" },
  { ref: 51, clientId: "cli-hotel", type: "maintenance", title: "Maintenance climatisation chambres", description: "Nettoyage des filtres et contrôle des unités des chambres 1 à 20.", day: 1, time: "09:00", duration: 180, tech: "thomas", amount: 760 },
  { ref: 52, clientId: "cli-rivage", type: "installation", title: "Pose de radiateurs connectés", description: "Remplacement de 9 convecteurs par des radiateurs à inertie pilotables.", day: 1, time: "13:30", duration: 240, tech: "julien", amount: 2350 },
  { ref: 53, clientId: "cli-horizon", type: "installation", title: "Installation éclairage LED open space", description: "Remplacement de 32 dalles fluorescentes par des dalles LED avec gradation.", day: 2, time: "08:00", duration: 300, tech: "julien", amount: 2450, priority: "IMPORTANTE" },
  { ref: 54, clientId: "cli-clinique", type: "entretien", title: "Entretien groupe électrogène", description: "Essai en charge, contrôle des niveaux et du préchauffage.", day: 2, time: "10:00", duration: 120, tech: "lucas", amount: 640, priority: "IMPORTANTE" },
  { ref: 55, clientId: "cli-nova", type: "depannage", title: "Coupure prises bureau 3", description: "Plus de courant sur les prises du bureau 3 depuis ce matin.", day: 2, time: "14:00", duration: 60, tech: "thomas", amount: 160 },
  { ref: 56, clientId: "cli-chenes", type: "maintenance", title: "Maintenance pompe de piscine", description: "Contrôle de la pompe de filtration et de l'horloge de programmation.", day: 3, time: "09:30", duration: 90, tech: "lucas", amount: 280 },
  { ref: 57, clientId: "cli-ecole", type: "installation", title: "Alimentation tableaux numériques", description: "Création de circuits dédiés pour 4 tableaux numériques interactifs.", day: 3, time: "13:30", duration: 120, tech: "julien", amount: 540 },
  { ref: 58, clientId: "cli-jardins", type: "maintenance", title: "Maintenance portail automatique", description: "Réglage des fins de course et contrôle des cellules de sécurité.", day: 4, time: "10:00", duration: 90, tech: "thomas", amount: 310 },
  { ref: 59, clientId: "cli-forme", type: "depannage", title: "Ballon d'eau chaude vestiaires", description: "Plus d'eau chaude dans les vestiaires hommes. Contrôle de la résistance et du thermostat.", day: 5, time: "08:30", duration: 120, tech: "lucas", amount: 520, priority: "URGENTE" },
  { ref: 60, clientId: "cli-lumen", type: "entretien", title: "Entretien climatisation bureaux", description: "Entretien semestriel des cassettes des bureaux administratifs.", day: 6, time: "09:00", duration: 90, tech: "thomas", amount: 290 },
  { ref: 61, clientId: "cli-quartz", type: "installation", title: "Installation alarme et contrôle d'accès", description: "Pose d'une centrale d'alarme, de 4 détecteurs et d'un lecteur de badges.", day: 7, time: "08:30", duration: 300, tech: "julien", amount: 1750 },

  // ——— À planifier ———
  { ref: 62, clientId: "cli-logistique", type: "maintenance", title: "Contrôle thermographique armoires électriques", description: "Thermographie infrarouge des armoires de distribution (demande de l'assureur).", day: null, time: null, duration: 180, tech: null, amount: 890, priority: "IMPORTANTE" },
  { ref: 63, clientId: "cli-marche", type: "installation", title: "Remplacement éclairage surface de vente", description: "Suite au devis DEV-2026-022 en attente de validation.", day: null, time: null, duration: 420, tech: null, amount: 4250 },
  { ref: 64, clientId: "cli-agora", type: "depannage", title: "Éclairage de secours défaillant salle 2", description: "Trois blocs autonomes ne s'allument plus lors du test mensuel.", day: null, time: null, duration: 60, tech: null, amount: 260, priority: "URGENTE" },
  { ref: 65, clientId: "cli-creche", type: "maintenance", title: "Révision des radiateurs", description: "Purge et équilibrage des radiateurs avant la saison de chauffe.", day: null, time: null, duration: 120, tech: null, amount: 340 },
];
