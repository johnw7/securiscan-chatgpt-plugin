/**
 * Méthode de cotation configurable (stockée dans audit_templates.scoring).
 * Score = vraisemblance × impact ; niveau déterminé par des seuils.
 * Les résultats calculés restent INDICATIFS jusqu'à validation par un consultant.
 * Aucun import d'alias : module partagé avec les scripts Node.
 */
export type Scale = { min: number; max: number; labels: string[] };
export type Level = { min: number; max: number; label: string; tone: "success" | "gold" | "warning" | "danger" };
export type ScoringMethod = {
  name: string;
  likelihood: Scale;
  impact: Scale;
  levels: Level[];
  criteria: Array<{ key: string; label: string }>;
};

export const DEFAULT_SCORING: ScoringMethod = {
  name: "Matrice NOAMIS 4×4 (vraisemblance × gravité)",
  likelihood: { min: 1, max: 4, labels: ["Rare", "Possible", "Probable", "Quasi certain"] },
  impact: { min: 1, max: 4, labels: ["Mineur", "Significatif", "Grave", "Critique"] },
  levels: [
    { min: 1, max: 3, label: "Faible", tone: "success" },
    { min: 4, max: 6, label: "Modéré", tone: "gold" },
    { min: 7, max: 9, label: "Élevé", tone: "warning" },
    { min: 10, max: 16, label: "Critique", tone: "danger" },
  ],
  criteria: [
    { key: "exposition", label: "Exposition du site (environnement, historique d'incidents)" },
    { key: "attractivite", label: "Attractivité des actifs pour un acteur malveillant" },
    { key: "mesures", label: "Efficacité des mesures existantes" },
    { key: "consequences", label: "Conséquences humaines, matérielles, d'image ou d'activité" },
  ],
};

export function parseScoring(value: unknown): ScoringMethod {
  const v = (value ?? {}) as Partial<ScoringMethod>;
  const okScale = (s: unknown): s is Scale =>
    !!s && typeof (s as Scale).min === "number" && typeof (s as Scale).max === "number" && Array.isArray((s as Scale).labels);
  return {
    name: typeof v.name === "string" ? v.name : DEFAULT_SCORING.name,
    likelihood: okScale(v.likelihood) ? v.likelihood : DEFAULT_SCORING.likelihood,
    impact: okScale(v.impact) ? v.impact : DEFAULT_SCORING.impact,
    levels: Array.isArray(v.levels) && v.levels.length ? (v.levels as Level[]) : DEFAULT_SCORING.levels,
    criteria: Array.isArray(v.criteria) ? v.criteria : DEFAULT_SCORING.criteria,
  };
}

export function riskScore(likelihood: number, impact: number): number {
  return likelihood * impact;
}

export function riskLevel(method: ScoringMethod, score: number): Level {
  return (
    method.levels.find((l) => score >= l.min && score <= l.max) ??
    (score > Math.max(...method.levels.map((l) => l.max)) ? method.levels[method.levels.length - 1]! : method.levels[0]!)
  );
}

export function clampToScale(value: number, scale: Scale): number {
  return Math.min(scale.max, Math.max(scale.min, Math.round(value)));
}

/** Réponse type d'un questionnaire d'audit. */
export type Conformity = "conforme" | "partiel" | "non_conforme" | "na";
export type Answer = { value?: Conformity; comment?: string };
export type Question = { id: string; category: string; label: string; guidance?: string; weight?: number };

export const CONFORMITY_LABELS: Record<Conformity, string> = {
  conforme: "Conforme",
  partiel: "Partiellement conforme",
  non_conforme: "Non conforme",
  na: "Non applicable",
};

/** Taux de conformité indicatif par catégorie (pondéré). */
export function conformityByCategory(questions: Question[], answers: Record<string, Answer>) {
  const out: Record<string, { answered: number; total: number; rate: number | null }> = {};
  for (const q of questions) {
    const entry = (out[q.category] ??= { answered: 0, total: 0, rate: null });
    entry.total += 1;
    const a = answers[q.id]?.value;
    if (a) entry.answered += 1;
  }
  for (const cat of Object.keys(out)) {
    const qs = questions.filter((q) => q.category === cat);
    let num = 0;
    let den = 0;
    for (const q of qs) {
      const a = answers[q.id]?.value;
      const w = q.weight ?? 1;
      if (!a || a === "na") continue;
      den += w;
      num += a === "conforme" ? w : a === "partiel" ? w / 2 : 0;
    }
    out[cat]!.rate = den ? Math.round((num / den) * 100) : null;
  }
  return out;
}
