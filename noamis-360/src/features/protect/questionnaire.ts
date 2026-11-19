/**
 * NOAMIS PROTECT — questionnaire de diagnostic préliminaire (public).
 * Évaluation INDICATIVE de bonnes pratiques générales : ce n'est pas un audit
 * de sûreté. Aucune adresse n'est demandée. Module pur, testé unitairement.
 */
export type Audience = "particulier" | "commerce" | "petite_entreprise";
export type ProtectAnswer = "oui" | "partiel" | "non" | "ne_sait_pas";
export type ProtectQuestion = { id: string; theme: string; label: string; weight: number; advice: string };

export const AUDIENCES: Record<Audience, { label: string; description: string }> = {
  particulier: { label: "Particulier", description: "Maison ou appartement, résidence principale ou secondaire." },
  commerce: { label: "Commerce", description: "Boutique, restaurant, agence, local recevant du public." },
  petite_entreprise: { label: "Petite entreprise", description: "Bureaux, atelier ou entrepôt de petite taille." },
};

export const ANSWER_LABELS: Record<ProtectAnswer, string> = { oui: "Oui", partiel: "En partie", non: "Non", ne_sait_pas: "Je ne sais pas" };

const q = (id: string, theme: string, label: string, weight: number, advice: string): ProtectQuestion => ({ id, theme, label, weight, advice });

export const QUESTIONS: Record<Audience, ProtectQuestion[]> = {
  particulier: [
    q("p1", "Accès", "Vos portes d'entrée sont-elles robustes et équipées d'une serrure de qualité ?", 3, "Renforcez les accès principaux (porte, serrure certifiée, cornières) en priorité sur les points les plus exposés."),
    q("p2", "Accès", "Les fenêtres et baies accessibles depuis l'extérieur sont-elles protégées ?", 2, "Protégez les ouvrants accessibles de plain-pied (volets, vitrages renforcés, entrebâilleurs)."),
    q("p3", "Détection", "Disposez-vous d'un système d'alarme entretenu et utilisé systématiquement ?", 3, "Un système de détection n'est efficace que s'il est entretenu, activé à chaque absence et relié à une chaîne d'alerte."),
    q("p4", "Détection", "Une personne ou un service est-il prévenu en cas de déclenchement ?", 2, "Définissez qui est alerté en cas de déclenchement et comment la levée de doute est réalisée."),
    q("p5", "Extérieurs", "Les abords sont-ils éclairés et dégagés (pas de cachette, d'échelle ou d'outil accessible) ?", 2, "Dégagez la végétation masquant les accès, rangez outils et échelles, éclairez les abords."),
    q("p6", "Habitudes", "Évitez-vous de signaler vos absences (réseaux sociaux, courrier, volets fermés en journée) ?", 2, "Limitez les signes d'absence : relève du courrier, éclairage programmé, discrétion en ligne."),
    q("p7", "Habitudes", "Clés et papiers de véhicule sont-ils rangés hors de vue près de l'entrée ?", 2, "Ne laissez pas clés et documents visibles près des ouvertures : c'est un facteur de home-jacking."),
    q("p8", "Biens", "Vos objets de valeur sont-ils inventoriés (photos, factures, numéros de série) ?", 1, "Constituez un inventaire photographique de vos biens de valeur et conservez-le hors du domicile."),
    q("p9", "Réaction", "Votre famille sait-elle comment réagir face à une intrusion (ne pas s'interposer, appeler le 17) ?", 2, "Définissez des consignes familiales simples : se mettre en sécurité, ne pas s'interposer, appeler le 17."),
  ],
  commerce: [
    q("c1", "Accès", "La vitrine et les accès sont-ils protégés hors des heures d'ouverture (rideau, vitrage, serrures) ?", 3, "Protégez vitrines et accès hors ouverture (rideau métallique, vitrage retardateur, serrures de qualité)."),
    q("c2", "Accès", "Les accès de service (réserve, livraisons) sont-ils maîtrisés en permanence ?", 2, "Contrôlez les accès secondaires : fermeture systématique, alarme d'ouverture, procédure de livraison."),
    q("c3", "Détection", "Disposez-vous d'une alarme intrusion reliée à une télésurveillance ou à un responsable ?", 3, "Reliez la détection intrusion à une chaîne d'alerte (télésurveillance ou responsable joignable)."),
    q("c4", "Vidéo", "La vidéoprotection couvre-t-elle les zones utiles avec des images exploitables ?", 2, "Vérifiez la couverture des zones d'enjeu, la qualité d'image et l'information réglementaire du public."),
    q("c5", "Fonds", "Les fonds sont-ils limités en caisse et déposés régulièrement, de façon variable ?", 3, "Limitez les espèces en caisse, utilisez un coffre adapté et variez horaires et trajets de dépôt."),
    q("c6", "Organisation", "Les procédures d'ouverture et de fermeture sont-elles définies et connues du personnel ?", 2, "Formalisez des consignes d'ouverture/fermeture (à deux si possible, vérifications, signal d'alerte)."),
    q("c7", "Personnel", "Le personnel est-il sensibilisé au vol, à l'agression et à la conduite à tenir ?", 2, "Sensibilisez l'équipe : prévention des vols, comportement en cas d'agression, priorité à la sécurité des personnes."),
    q("c8", "Réaction", "Les incidents (vols, tentatives, incivilités) sont-ils notés et signalés ?", 1, "Consignez les incidents et signalez-les : ils permettent d'adapter les mesures et d'échanger avec les forces de l'ordre."),
  ],
  petite_entreprise: [
    q("e1", "Accès", "L'accès aux locaux est-il contrôlé (badges ou clés nominatifs, retrait au départ) ?", 3, "Attribuez des accès nominatifs, tenez-les à jour et retirez-les systématiquement au départ d'un salarié."),
    q("e2", "Accès", "Les visiteurs et prestataires sont-ils accueillis, identifiés et accompagnés ?", 2, "Mettez en place un accueil des visiteurs : identification, registre, accompagnement en zone non publique."),
    q("e3", "Détection", "Les locaux sont-ils protégés par une alarme reliée à une chaîne d'alerte ?", 3, "Reliez la détection intrusion à une télésurveillance ou à une astreinte, et testez-la régulièrement."),
    q("e4", "Vidéo", "La vidéoprotection est-elle adaptée, conforme et ses accès protégés ?", 2, "Vérifiez la pertinence des caméras, la conformité (information, durée de conservation) et la protection de l'enregistreur."),
    q("e5", "Actifs", "Les équipements et informations sensibles sont-ils identifiés et protégés ?", 2, "Identifiez vos actifs sensibles (matériel, données, stocks) et protégez-les en conséquence."),
    q("e6", "Organisation", "Un responsable sûreté et des consignes écrites existent-ils ?", 2, "Désignez un référent sûreté et formalisez les consignes essentielles (fermeture, incident, alerte)."),
    q("e7", "Continuité", "Avez-vous prévu la poursuite de l'activité après un sinistre (vol, intrusion, dégradation) ?", 2, "Anticipez la reprise d'activité : sauvegardes, contacts d'urgence, matériel de remplacement, assurances."),
    q("e8", "Personnel", "Les salariés connaissent-ils les réflexes de sûreté et la conduite à tenir ?", 1, "Sensibilisez régulièrement les équipes aux risques et aux réflexes de sûreté."),
  ],
};

export type ProtectResult = {
  score: number;
  level: "a_renforcer" | "intermediaire" | "satisfaisant";
  byTheme: Array<{ theme: string; score: number }>;
  recommendations: Array<{ theme: string; text: string; priority: "haute" | "moyenne" }>;
  answered: number;
};

const VALUE: Record<ProtectAnswer, number> = { oui: 1, partiel: 0.5, non: 0, ne_sait_pas: 0.25 };

export function scoreProtect(audience: Audience, answers: Record<string, ProtectAnswer>): ProtectResult {
  const questions = QUESTIONS[audience];
  let num = 0;
  let den = 0;
  const themes = new Map<string, { num: number; den: number }>();
  const recommendations: ProtectResult["recommendations"] = [];
  let answered = 0;
  for (const question of questions) {
    const a = answers[question.id];
    if (a) answered += 1;
    const v = VALUE[a ?? "ne_sait_pas"];
    num += v * question.weight;
    den += question.weight;
    const t = themes.get(question.theme) ?? { num: 0, den: 0 };
    themes.set(question.theme, { num: t.num + v * question.weight, den: t.den + question.weight });
    if (v < 1) recommendations.push({ theme: question.theme, text: question.advice, priority: v === 0 && question.weight >= 3 ? "haute" : "moyenne" });
  }
  const score = Math.round((num / den) * 100);
  return {
    score,
    level: score < 40 ? "a_renforcer" : score < 70 ? "intermediaire" : "satisfaisant",
    byTheme: [...themes.entries()].map(([theme, t]) => ({ theme, score: Math.round((t.num / t.den) * 100) })),
    recommendations: recommendations.sort((a, b) => (a.priority === b.priority ? 0 : a.priority === "haute" ? -1 : 1)),
    answered,
  };
}

export const LEVEL_LABELS: Record<ProtectResult["level"], string> = {
  a_renforcer: "Protection à renforcer",
  intermediaire: "Protection intermédiaire",
  satisfaisant: "Bonnes pratiques largement en place",
};

export const DISCLAIMER =
  "Ce diagnostic préliminaire est une auto-évaluation indicative fondée sur vos seules déclarations. Il ne constitue ni un audit de sûreté, ni une garantie, ni un conseil personnalisé. Seule une étude sur site par un consultant permet d'évaluer précisément les risques et les mesures adaptées. En cas d'urgence, composez le 17 ou le 112.";
