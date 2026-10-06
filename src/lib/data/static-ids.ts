import { CLIENT_SEEDS } from "./clients";
import { INTERVENTION_SEEDS } from "./interventions";
import { interventionRef } from "./seed";

/**
 * Identifiants pré-générés pour l'export statique (GitHub Pages) : les pages de détail
 * lisent leurs données côté navigateur, il suffit donc que l'URL existe.
 * Des emplacements sont réservés aux éléments créés pendant la démonstration.
 */
const RESERVED_INTERVENTIONS = 60;
const RESERVED_CLIENTS = 30;

export const NEW_CLIENT_PREFIX = "cli-new-";

export function interventionIds(): string[] {
  const max = Math.max(...INTERVENTION_SEEDS.map((s) => s.ref));
  const extra = Array.from({ length: RESERVED_INTERVENTIONS }, (_, i) => max + 1 + i);
  return [...INTERVENTION_SEEDS.map((s) => s.ref), ...extra].map(interventionRef);
}

export function clientIds(): string[] {
  const extra = Array.from({ length: RESERVED_CLIENTS }, (_, i) => `${NEW_CLIENT_PREFIX}${i + 1}`);
  return [...CLIENT_SEEDS.map((c) => c.id), ...extra];
}
