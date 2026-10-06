export interface DemoStep {
  key: string;
  title: string;
  caption: string;
  href: string;
}

/** Démonstration guidée (30 à 60 secondes) pensée pour un enregistrement vidéo LinkedIn. */
export const DEMO_STEPS: DemoStep[] = [
  {
    key: "dashboard",
    title: "Tableau de bord",
    caption: "Toute l'activité de l'entreprise en un coup d'œil : interventions, équipe, chiffre d'affaires.",
    href: "/",
  },
  {
    key: "create",
    title: "Création d'une intervention",
    caption: "Une demande client devient une intervention planifiée en quelques secondes.",
    href: "/interventions?nouvelle=demo",
  },
  {
    key: "planning",
    title: "Planning",
    caption: "Le planning de l'équipe se met à jour instantanément. Fini le tableau Excel.",
    href: "/planning",
  },
  {
    key: "mobile",
    title: "Vue technicien mobile",
    caption: "Sur le terrain, Thomas retrouve sa journée sur son smartphone et démarre l'intervention.",
    href: "/technicien",
  },
  {
    key: "checklist",
    title: "Checklist",
    caption: "Chaque étape est cochée sur place : rien n'est oublié, tout est tracé.",
    href: "/technicien?intervention=INT-2026-042&section=checklist",
  },
  {
    key: "signature",
    title: "Signature client",
    caption: "Le client signe sur l'écran. Le rapport part automatiquement par e-mail.",
    href: "/technicien?intervention=INT-2026-042&section=signature",
  },
  {
    key: "stats",
    title: "Statistiques",
    caption: "Le dirigeant pilote son activité avec des indicateurs fiables, en temps réel.",
    href: "/statistiques",
  },
];

export const DEMO_INTERVENTION_ID = "INT-2026-042";
