/**
 * Mode démonstration tant qu'aucun backend n'est configuré.
 * Pour passer en production : renseigner .env (voir .env.example) et brancher Supabase / Stripe
 * dans les services ci-dessous, sans changer les pages.
 */
export const config = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string | undefined,
  apiUrl: import.meta.env.VITE_API_URL as string | undefined,
  stripeKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined,
};

export const isDemoBackend = !config.supabaseUrl;
export const isStripeReady = Boolean(config.apiUrl && config.stripeKey);
