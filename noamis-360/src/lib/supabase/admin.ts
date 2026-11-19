import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { publicEnv } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";

/**
 * Client « service role » : contourne la RLS. Réservé au serveur, et utilisé
 * UNIQUEMENT après une vérification explicite des droits de l'utilisateur
 * (stockage privé, invitations, diagnostic public).
 */
export function createAdminClient() {
  return createClient<Database>(publicEnv().NEXT_PUBLIC_SUPABASE_URL, serverEnv().SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
