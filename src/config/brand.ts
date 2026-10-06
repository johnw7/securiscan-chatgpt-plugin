/**
 * Identité E-DUST Solutions et réglages du démonstrateur.
 */
export const BRAND = {
  productName: "E-DUST INTERVENTION",
  vendor: "E-DUST Solutions",
  demoNotice: "Démonstration E-DUST Solutions",
  colors: {
    navy: "#021448",
    electric: "#0B58FF",
    cyan: "#01DAFF",
    white: "#FFFFFF",
  },
  gradient: "linear-gradient(135deg, #01DAFF 0%, #0B58FF 100%)",
  /**
   * Lien du bouton « Parlons de votre projet » de l'écran final du mode démo.
   * À renseigner via NEXT_PUBLIC_EDUST_CONTACT_URL (ex. URL de prise de rendez-vous).
   */
  contactUrl: process.env.NEXT_PUBLIC_EDUST_CONTACT_URL ?? "",
} as const;

/** Palette catégorielle des graphiques (validée daltonisme / contraste). */
export const CHART_COLORS = {
  maintenance: "#0B58FF",
  installation: "#0891B2",
  depannage: "#8B5CF6",
  entretien: "#D97706",
} as const;
