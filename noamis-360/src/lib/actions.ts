import "server-only";
import type { z } from "zod";
import { authorize, type SessionContext } from "@/lib/auth/session";
import { fail, type ActionResult } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type { Capability } from "@/lib/permissions";
import { createClient, type ServerSupabase } from "@/lib/supabase/server";
import { fieldErrors } from "@/lib/validation/common";

export type ActionContext = { session: SessionContext; supabase: ServerSupabase };

/**
 * Enveloppe de toute Server Action :
 * 1. vérifie la session et la capacité (côté serveur, MFA comprise) ;
 * 2. valide l'entrée avec Zod (jamais de confiance dans le client) ;
 * 3. exécute avec le client Supabase de l'utilisateur (RLS appliquée) ;
 * 4. transforme les erreurs en messages sûrs, sans détail technique.
 */
export async function guarded<S extends z.ZodType, R = undefined>(
  capability: Capability,
  schema: S,
  input: unknown,
  handler: (data: z.output<S>, ctx: ActionContext) => Promise<ActionResult<R>>,
): Promise<ActionResult<R>> {
  const session = await authorize(capability);
  if (!session) return { ok: false, error: "Accès refusé ou session expirée." };
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Certains champs sont invalides.", fieldErrors: fieldErrors(parsed.error) };
  }
  try {
    const supabase = await createClient();
    return await handler(parsed.data, { session, supabase });
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error && String((error as { digest: unknown }).digest).startsWith("NEXT_")) {
      throw error; // redirect() / notFound()
    }
    logger.error("action.failed", { capability, error });
    return fail(error);
  }
}

/** Lève l'erreur Supabase éventuelle pour qu'elle soit traduite par `guarded`. */
export function check<T>(res: { data: T; error: unknown }): NonNullable<T> {
  if (res.error) throw res.error;
  if (res.data === null || res.data === undefined) throw { code: "42501", message: "Élément introuvable ou accès refusé" };
  return res.data as NonNullable<T>;
}
