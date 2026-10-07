/**
 * Visuels fournis pour la vidéo de prévention (public/images/prevention).
 *
 * - sources/ : images d'origine fournies (1024 × 1536, RGB, sans transparence)
 * - enfant/, policier/ : personnages détourés (IA IS-Net + alpha matting), recadrés sur leur silhouette
 * - decors/ : place de la mairie issue de la photo du policier, policier retiré (inpainting) puis
 *   flouté pour simuler une profondeur de champ
 */

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const dir = `${BASE}/images/prevention`;

export type CharacterAsset = {
  src: string;
  /** Dimensions réelles du fichier détouré. */
  width: number;
  height: number;
  /** Position horizontale du centre du corps dans l'image (0 → 1), pour placer les pieds. */
  anchorX: number;
};

export const CHILD: CharacterAsset = {
  src: `${dir}/enfant/enfant-detoure.webp`,
  width: 730,
  height: 1515,
  anchorX: 0.36,
};

export const OFFICER: CharacterAsset = {
  src: `${dir}/policier/policier-detoure.webp`,
  width: 545,
  height: 1493,
  anchorX: 0.5,
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

export const ALL_IMAGES = [CHILD.src, OFFICER.src, DECOR.original, DECOR.place, DECOR.placeFlou];
