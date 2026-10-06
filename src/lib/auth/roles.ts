import type { Role } from "../types";

/**
 * Matrice de permissions, prête pour l'authentification (Auth.js / Clerk / Supabase Auth).
 * La démo fonctionne avec le profil « admin » (dirigeant) et la vue technicien.
 */
export type Permission =
  | "clients:read"
  | "clients:write"
  | "interventions:read"
  | "interventions:write"
  | "interventions:execute"
  | "planning:write"
  | "quotes:write"
  | "invoices:write"
  | "settings:write"
  | "stats:read";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    "clients:read", "clients:write", "interventions:read", "interventions:write", "interventions:execute",
    "planning:write", "quotes:write", "invoices:write", "settings:write", "stats:read",
  ],
  planificateur: ["clients:read", "clients:write", "interventions:read", "interventions:write", "planning:write", "quotes:write", "stats:read"],
  technicien: ["clients:read", "interventions:read", "interventions:execute"],
  client: ["interventions:read"],
};

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrateur",
  planificateur: "Planification",
  technicien: "Technicien",
  client: "Client",
};
