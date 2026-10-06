import type { Period } from "../types";

/**
 * Indicateurs consolidés (historique de l'entreprise fictive).
 * Les compteurs « vivants » sont ajustés par le store en fonction des actions
 * réalisées pendant la démonstration (création, démarrage, clôture…).
 */
export interface KpiBaseline {
  interventions: number;
  inProgress: number;
  done: number;
  revenue: number;
  revenueLabel: string;
  trends: { interventions: number; inProgress: number; done: number; revenue: number };
}

export const KPI_BASELINE: Record<Period, KpiBaseline> = {
  today: {
    interventions: 8,
    inProgress: 3,
    done: 5,
    revenue: 24850,
    revenueLabel: "Chiffre d'affaires du mois",
    trends: { interventions: 12, inProgress: 8, done: 6, revenue: 8 },
  },
  week: {
    interventions: 37,
    inProgress: 3,
    done: 26,
    revenue: 6340,
    revenueLabel: "Chiffre d'affaires de la semaine",
    trends: { interventions: 9, inProgress: 8, done: 11, revenue: 5 },
  },
  month: {
    interventions: 146,
    inProgress: 3,
    done: 128,
    revenue: 24850,
    revenueLabel: "Chiffre d'affaires du mois",
    trends: { interventions: 5, inProgress: 8, done: 7, revenue: 8 },
  },
};

/** Volume d'interventions des jours ouvrés précédents (du plus ancien au plus récent). */
export const LAST_DAYS_VOLUME = [7, 9, 6, 10, 8, 9];

/** Six derniers mois, du plus ancien au plus récent (le dernier = mois en cours). */
export const MONTHLY_REVENUE = [18200, 19850, 21400, 20100, 22900, 24850];
export const MONTHLY_INTERVENTIONS = [112, 124, 131, 118, 139, 146];

export const TYPE_SHARE = { maintenance: 38, installation: 22, depannage: 24, entretien: 16 } as const;

export const QUALITY = {
  resolutionRate: 94,
  resolutionTrend: 2,
  avgDurationMin: 112,
  avgDurationTrend: -6,
  satisfaction: 4.8,
  satisfactionReviews: 213,
  firstVisitFix: 89,
} as const;
