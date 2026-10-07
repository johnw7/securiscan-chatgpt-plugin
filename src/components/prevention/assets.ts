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
    mouth: { src: `${rig}/enfant-bouche.webp`, x: 269, y: 299, w: 104, h: 58, rest: 0.16 },
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
    // La bouche de l'enfant (même style de rendu), réduite à la bouche du policier ; masquée au repos.
    mouth: { src: `${rig}/enfant-bouche.webp`, x: 221, y: 175, w: 88, h: 56, rest: 0 },
    lids: { src: `${rig}/policier-paupieres.webp`, x: 195, y: 112, w: 117, h: 61 },
  },
};

export const DECOR = {
  /** Photo d'origine du policier devant la mairie (plan d'ouverture). */
  original: `${dir}/sources/policier-original.webp`,
  /** Place de la mairie sans le policier, flou léger. */
  place: `${dir}/decors/place-mairie.webp`,
  /** Même décor, flou prononcé (plans serrés). */
  placeFlou: `${dir}/decors/place-mairie-flou.webp`,
  width: 1024,
  height: 1536,
};

/** Bande-son (voix + bruitages + musique). MP3 : lisible par tous les navigateurs. */
export const SOUNDTRACK = `${BASE}/audio/prevention/bande-son.mp3`;

export const ALL_IMAGES = [
  DECOR.original,
  DECOR.place,
  DECOR.placeFlou,
  ...[CHILD, OFFICER].flatMap((c) => [c.rig.body, c.rig.head, c.rig.mouth.src, c.rig.lids.src, ...(c.rig.hand ? [c.rig.hand.src] : [])]),
];
