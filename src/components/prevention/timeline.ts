import { CUE_ENDS, LIPSYNC, LIPSYNC_FPS } from "./lipsync";

/**
 * Scénario, découpage et sous-titres de la vidéo de prévention
 * « Sur le chemin de l'école » — Police Municipale.
 *
 * Tout le rendu est une fonction pure du temps : la même seconde donne toujours la même image,
 * ce qui permet la lecture, le déplacement dans la timeline et l'export image par image.
 */

export type Format = "9x16" | "4x5";

export const STAGE_W = 1080;
export const STAGE_H: Record<Format, number> = { "9x16": 1920, "4x5": 1350 };
export const FORMAT_LABEL: Record<Format, string> = { "9x16": "9:16", "4x5": "4:5" };

export type Speaker = "enfant" | "policier";

export const SPEAKERS: Record<Speaker, { name: string; color: string }> = {
  enfant: { name: "Léo", color: "#f59e0b" },
  policier: { name: "Policier municipal", color: "#0b58ff" },
};

export type ShotId =
  | "intro"
  | "enfant-1"
  | "policier-1"
  | "duo"
  | "conseil-1"
  | "conseil-2"
  | "conseil-3"
  | "enfant-2"
  | "policier-2"
  | "final";

export type Shot = {
  id: ShotId;
  start: number;
  end: number;
  /** Libellé affiché dans la timeline du lecteur. */
  label: string;
  /** Type de plan (repère de réalisation). */
  plan: string;
  /**
   * Transition d'entrée : cut franc (champ / contrechamp), volet balayé (wipe) ou passage par le noir (dip).
   * Pas de fondu enchaîné entre deux plans de personnages : il créerait une double exposition.
   */
  transition: Transition;
};

export type Transition = { type: "cut" } | { type: "wipe" | "dip"; dur: number };

export const SHOTS: Shot[] = [
  { id: "intro", start: 0, end: 5, label: "Ouverture", plan: "Plan d'ensemble", transition: { type: "cut" } },
  { id: "enfant-1", start: 5, end: 10.5, label: "Léo", plan: "Plan enfant", transition: { type: "wipe", dur: 0.6 } },
  { id: "policier-1", start: 10.5, end: 16.5, label: "Policier", plan: "Plan policier", transition: { type: "cut" } },
  { id: "duo", start: 16.5, end: 20, label: "Plan à deux", plan: "Plan à deux", transition: { type: "cut" } },
  { id: "conseil-1", start: 20, end: 27.5, label: "Conseil 1", plan: "Insert conseil", transition: { type: "wipe", dur: 0.55 } },
  { id: "conseil-2", start: 27.5, end: 35, label: "Conseil 2", plan: "Insert conseil", transition: { type: "wipe", dur: 0.55 } },
  { id: "conseil-3", start: 35, end: 42.5, label: "Conseil 3", plan: "Insert conseil", transition: { type: "wipe", dur: 0.55 } },
  { id: "enfant-2", start: 42.5, end: 47.5, label: "Léo", plan: "Plan enfant", transition: { type: "cut" } },
  { id: "policier-2", start: 47.5, end: 51.5, label: "Policier", plan: "Plan policier", transition: { type: "cut" } },
  { id: "final", start: 51.5, end: 58, label: "Final", plan: "Plan final", transition: { type: "dip", dur: 0.8 } },
];

export const DURATION = SHOTS[SHOTS.length - 1].end;

export type Cue = { start: number; end: number; speaker: Speaker; text: string; /** index dans LIPSYNC */ line: number };

/** Répliques : début calé à la main, fin = durée réelle de la voix (+ petite marge de lecture). */
const LINES: Omit<Cue, "end" | "line">[] = [
  { start: 5.5, speaker: "enfant", text: "Bonjour monsieur le policier !" },
  { start: 7.3, speaker: "enfant", text: "Aujourd'hui, je vais à l'école tout seul pour la première fois !" },
  { start: 10.9, speaker: "policier", text: "Bonjour Léo ! Bravo, tu deviens grand." },
  { start: 13.3, speaker: "policier", text: "Avant de partir, retiens bien mes trois conseils." },
  { start: 16.9, speaker: "enfant", text: "Trois conseils ? Je t'écoute !" },
  { start: 20.5, speaker: "policier", text: "Un : pour traverser, utilise toujours le passage piéton." },
  { start: 23.9, speaker: "policier", text: "Regarde à gauche, à droite, puis encore à gauche." },
  { start: 27.9, speaker: "policier", text: "Deux : ne suis jamais une personne que tu ne connais pas…" },
  { start: 30.8, speaker: "policier", text: "… même si elle te propose un cadeau ou de te raccompagner." },
  { start: 35.4, speaker: "policier", text: "Trois : si tu as peur ou si tu es perdu, va voir un adulte de confiance." },
  { start: 39.8, speaker: "policier", text: "Et en cas d'urgence, on appelle le 17." },
  { start: 42.9, speaker: "enfant", text: "Passage piéton, jamais d'inconnu, et le 17." },
  { start: 45.6, speaker: "enfant", text: "C'est noté, merci !" },
  { start: 47.9, speaker: "policier", text: "Parfait, Léo ! Bonne route et bonne journée à l'école !" },
];

export const CUES: Cue[] = LINES.map((l, i) => ({
  ...l,
  line: i,
  // ne déborde ni sur la réplique suivante, ni sur le plan suivant
  end: Math.min(CUE_ENDS[i] + 0.3, LINES[i + 1]?.start ?? DURATION, SHOTS.find((sh) => l.start < sh.end)?.end ?? DURATION),
}));

/** Ouverture de la bouche (0 → 1) du personnage à l'instant t, d'après l'enveloppe de sa voix. */
export function mouthOpen(t: number, speaker: Speaker): number {
  const c = CUES.find((q) => q.speaker === speaker && t >= q.start && t < CUE_ENDS[q.line] + 0.1);
  if (!c) return 0;
  const data = LIPSYNC[c.line];
  const f = (t - c.start) * LIPSYNC_FPS;
  const i = Math.floor(f);
  const v = (j: number) => (j >= 0 && j < data.length ? Number(data[j]) / 9 : 0);
  return lerp(v(i), v(i + 1), f - i);
}

export function shotAt(t: number): number {
  const i = SHOTS.findIndex((s) => t < s.end);
  return i === -1 ? SHOTS.length - 1 : i;
}

export function cueAt(t: number): Cue | undefined {
  return CUES.find((c) => t >= c.start && t < c.end);
}

/* ------------------------------------------------------------------ */
/* Outils d'animation                                                  */
/* ------------------------------------------------------------------ */

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
export const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);
/** Légère sur-oscillation pour les apparitions de pictogrammes. */
export const easeOutBack = (k: number) => {
  const c1 = 1.5;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
};

/** Progression 0 → 1 d'une apparition qui commence à `start` et dure `dur` secondes. */
export const appear = (t: number, start: number, dur = 0.5) => clamp01((t - start) / dur);

/** Format SRT (hh:mm:ss,mmm) pour l'export des sous-titres. */
export function toSrt(): string {
  const ts = (s: number) => {
    const ms = Math.round(s * 1000);
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    const pad = (n: number, l = 2) => String(n).padStart(l, "0");
    return `${pad(h)}:${pad(m)}:${pad(sec)},${pad(ms % 1000, 3)}`;
  };
  return CUES.map(
    (c, i) => `${i + 1}\n${ts(c.start)} --> ${ts(c.end)}\n${SPEAKERS[c.speaker].name.toUpperCase()} : ${c.text}\n`,
  ).join("\n");
}
