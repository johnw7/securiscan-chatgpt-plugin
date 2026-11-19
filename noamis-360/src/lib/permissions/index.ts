/**
 * Matrice des permissions applicatives (principe du moindre privilège).
 * Elle pilote l'affichage et les contrôles serveur ; la base de données
 * applique en plus ses propres règles (RLS, fonctions SECURITY DEFINER).
 */
export const ROLES = ["super_admin", "admin", "collaborator", "client"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super-administrateur",
  admin: "Administrateur NOAMIS",
  collaborator: "Collaborateur NOAMIS",
  client: "Client",
};

export const CAPABILITIES = {
  "workspace.access": ["super_admin", "admin", "collaborator"],
  "portal.access": ["client"],
  "crm.manage": ["super_admin", "admin", "collaborator"],
  "mission.manage": ["super_admin", "admin", "collaborator"],
  "mission.delete": ["super_admin", "admin"],
  "audit.manage": ["super_admin", "admin", "collaborator"],
  "audit.validate": ["super_admin", "admin", "collaborator"],
  "audit.templates.manage": ["super_admin", "admin"],
  "project.manage": ["super_admin", "admin", "collaborator"],
  "intelligence.manage": ["super_admin", "admin", "collaborator"],
  "intelligence.publish": ["super_admin", "admin", "collaborator"],
  "docs.manage": ["super_admin", "admin", "collaborator"],
  "docs.share": ["super_admin", "admin", "collaborator"],
  "finance.view": ["super_admin", "admin", "collaborator"],
  "finance.draft": ["super_admin", "admin", "collaborator"],
  "finance.issue": ["super_admin", "admin"],
  "finance.payments": ["super_admin", "admin"],
  "finance.catalog.manage": ["super_admin", "admin"],
  "finance.export": ["super_admin", "admin"],
  "connect.manage": ["super_admin", "admin", "collaborator"],
  "admin.users": ["super_admin", "admin"],
  "admin.organization": ["super_admin", "admin"],
  "admin.audit_logs": ["super_admin", "admin"],
  "admin.super_admins": ["super_admin"],
} as const satisfies Record<string, readonly Role[]>;

export type Capability = keyof typeof CAPABILITIES;

export function can(role: Role | null | undefined, capability: Capability): boolean {
  if (!role) return false;
  return (CAPABILITIES[capability] as readonly Role[]).includes(role);
}

export function isStaffRole(role: Role | null | undefined): role is "super_admin" | "admin" | "collaborator" {
  return role === "super_admin" || role === "admin" || role === "collaborator";
}

export function isAdminRole(role: Role | null | undefined): role is "super_admin" | "admin" {
  return role === "super_admin" || role === "admin";
}

/** Les administrateurs doivent utiliser la double authentification. */
export function requiresMfa(role: Role | null | undefined): boolean {
  return isAdminRole(role);
}

/** Rôles qu'un utilisateur peut attribuer. */
export function assignableRoles(actor: Role): Role[] {
  if (actor === "super_admin") return ["super_admin", "admin", "collaborator", "client"];
  if (actor === "admin") return ["admin", "collaborator", "client"];
  return [];
}
