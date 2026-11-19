/**
 * Traduction des erreurs techniques en messages utilisateur sûrs.
 * Aucun détail interne (SQL, pile d'appel, clé, URL) n'est renvoyé au client.
 */
export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

type PgLikeError = { code?: string; message?: string; details?: string; hint?: string };

const BUSINESS_MESSAGE = /^[A-ZÀ-Ü][^\n]{5,200}$/;

export function toUserMessage(error: unknown): string {
  const e = (error ?? {}) as PgLikeError;
  switch (e.code) {
    case "42501":
    case "PGRST301":
      return "Vous n'avez pas les droits nécessaires pour cette opération.";
    case "23505":
      return "Cet élément existe déjà (doublon).";
    case "23503":
      return "Cet élément est lié à d'autres données et ne peut pas être modifié ainsi.";
    case "23502":
      return "Un champ obligatoire est manquant.";
    case "22P02":
    case "22007":
      return "Une valeur saisie n'est pas au bon format.";
    case "P0429":
      return "Trop de demandes : veuillez réessayer plus tard.";
    case "23514":
    case "P0001":
      // Messages métier explicites levés par nos fonctions SQL (en français, sans détail technique).
      if (e.message && BUSINESS_MESSAGE.test(e.message) && !/violates|constraint|relation|column/i.test(e.message)) {
        return e.message;
      }
      return "Les données saisies ne respectent pas les règles de gestion.";
    default:
      return "Une erreur est survenue. Réessayez ou contactez l'administrateur.";
  }
}

export function fail(error: unknown): { ok: false; error: string } {
  return { ok: false, error: toUserMessage(error) };
}
