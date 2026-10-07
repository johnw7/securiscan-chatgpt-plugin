/**
 * Visuels fournis pour la vidéo de prévention (public/images/prevention).
 *
 * - sources/ : images d'origine fournies (1024 × 1536, RGB, sans transparence)
 * - enfant/, policier/ : personnages détourés (IA IS-Net + alpha matting), recadrés sur leur silhouette
 * - rig/ : les mêmes personnages découpés en pièces animables (corps, tête, main, bouche, paupières),
 *   toutes à la taille du personnage détouré pour se superposer exactement
 * - decors/ : place de la mairie issue de la photo du policier, policier retiré (inpainting) puis
 *   flouté pour simuler une profondeur de champ
 */

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const dir = `${BASE}/images/prevention`;

type Box = { x: number; y: number; w: number; h: number };

export type CharacterAsset = {
  /** Personnage détouré complet (référence). */
  src: string;
  /** Dimensions du fichier détouré (repère de toutes les coordonnées ci-dessous). */
  width: number;
  height: number;
  /** Position horizontale du centre du corps dans l'image (0 → 1), pour placer les pieds. */
  anchorX: number;
  rig: {
    body: string;
    head: string;
    /** Pivot de la tête (base du cou), en px de l'image. */
    neck: [number, number];
    /** Bouche animable (étirée verticalement selon la voix). */
    mouth: Box & { src: string; /** ouverture au repos (0 = sprite masqué) */ rest: number };
    lids: Box & { src: string };
    /** Main articulée au poignet (gestes). */
    hand?: { src: string; wrist: [number, number] };
    /** Avant-bras articulés au coude : image, pivot (coude) dans l'image, position du coude sur le corps. */
    arms?: Record<"geste" | "ceinture", { src: string; w: number; h: number; pivot: [number, number]; elbow: [number, number] }>;
  };
};

const rig = `${dir}/rig`;

export const CHILD: CharacterAsset = {
  src: `${dir}/enfant/enfant-detoure.webp`,
  width: 730,
  height: 1515,
  anchorX: 0.36,
  rig: {
    body: `${rig}/enfant-corps.webp`,
    head: `${rig}/enfant-tete.webp`,
    neck: [270, 418],
    mouth: { src: `${rig}/enfant-bouche.webp`, x: 269, y: 299, w: 104, h: 58, rest: 0.4 },
    lids: { src: `${rig}/enfant-paupieres.webp`, x: 209, y: 187, w: 164, h: 106 },
    hand: { src: `${rig}/enfant-main.webp`, wrist: [566, 566] },
  },
};

export const OFFICER: CharacterAsset = {
  src: `${dir}/policier/policier-detoure.webp`,
  width: 545,
  height: 1493,
  anchorX: 0.5,
  rig: {
    body: `${rig}/policier-corps.webp`,
    head: `${rig}/policier-tete.webp`,
    neck: [262, 268],
    // Sourire en coin d'origine effacé de la tête ; une seule bouche, animée (même style de rendu que l'enfant).
    mouth: { src: `${rig}/enfant-bouche.webp`, x: 221, y: 173, w: 86, h: 56, rest: 0.3 },
    lids: { src: `${rig}/policier-paupieres.webp`, x: 195, y: 112, w: 117, h: 61 },
    // Bras décroisés : avant-bras réels du policier, l'un en geste main ouverte, l'autre posé sur la ceinture.
    arms: {
      geste: { src: `${rig}/policier-avantbras-geste.webp`, w: 390, h: 168, pivot: [21, 97], elbow: [390, 545] },
      ceinture: { src: `${rig}/policier-avantbras-ceinture.webp`, w: 248, h: 142, pivot: [16, 71], elbow: [64, 582] },
    },
  },
};

export const DECOR = {
  /** Place de la mairie sans le policier, flou léger. */
  place: `${dir}/decors/place-mairie.webp`,
  /** Même décor, flou prononcé (plans serrés). */
  placeFlou: `${dir}/decors/place-mairie-flou.webp`,
  width: 1024,
  height: 1536,
};

/** Bande-son (voix + bruitages, sans musique). MP3 : lisible par tous les navigateurs. */
export const SOUNDTRACK = `${BASE}/audio/prevention/bande-son.mp3`;

export const ALL_IMAGES = [
  DECOR.place,
  DECOR.placeFlou,
  ...[CHILD, OFFICER].flatMap((c) => [c.rig.body, c.rig.head, c.rig.mouth.src, c.rig.lids.src, ...(c.rig.hand ? [c.rig.hand.src] : []), ...Object.values(c.rig.arms ?? {}).map((a) => a.src)]),
];
