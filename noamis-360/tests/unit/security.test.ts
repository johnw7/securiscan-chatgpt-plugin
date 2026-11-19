/**
 * Tests unitaires de sécurité : scénarios 7 (validation), 8 (fichiers),
 * 9 (erreurs sans secrets), 10 (journaux sans secrets), permissions, SSRF, robots.txt.
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { toUserMessage } from "@/lib/errors";
import { contentDisposition, sanitizeFileName, validateFile, DOCUMENT_KINDS, PHOTO_KINDS } from "@/lib/files";
import { redact } from "@/lib/logger";
import { assignableRoles, can, CAPABILITIES, requiresMfa } from "@/lib/permissions";
import { isForbiddenAddress, robotsAllows } from "@/lib/safe-fetch";
import { safeInternalPath } from "@/lib/utils";
import { clientSchema, missionSchema } from "@/features/pilot/schemas";
import { lineSchema } from "@/features/finance/schemas";
import { protectSchema } from "@/features/protect/schemas";
import { shareSchema } from "@/features/docs/schemas";

const bytes = (s: string | number[]) => (typeof s === "string" ? new TextEncoder().encode(s) : new Uint8Array(s));
const PDF = bytes("%PDF-1.7\n1 0 obj<<>>endobj\n%%EOF");
const PNG = bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const opts = { allowed: DOCUMENT_KINDS, maxBytes: 1024 };

describe("8. Contrôle des fichiers importés", () => {
  it("accepte un PDF et un PNG authentiques", () => {
    expect(validateFile(PDF, "rapport.pdf", opts)).toMatchObject({ ok: true, mime: "application/pdf" });
    expect(validateFile(PNG, "photo.png", { allowed: PHOTO_KINDS, maxBytes: 1024 })).toMatchObject({ ok: true, kind: "png" });
  });
  it("refuse les extensions non autorisées (exécutables, HTML, SVG)", () => {
    for (const name of ["a.exe", "a.html", "a.svg", "a.js", "a.docm", "a"]) expect(validateFile(PDF, name, opts).ok, name).toBe(false);
  });
  it("refuse un contenu qui ne correspond pas à l'extension", () => {
    expect(validateFile(bytes("<html><script>x</script>"), "faux.pdf", opts)).toEqual({ ok: false, error: "Le contenu du fichier ne correspond pas à son extension." });
    expect(validateFile(PDF, "image.png", { allowed: PHOTO_KINDS, maxBytes: 1024 }).ok).toBe(false);
  });
  it("refuse les fichiers vides ou trop volumineux", () => {
    expect(validateFile(new Uint8Array(), "a.pdf", opts).ok).toBe(false);
    expect(validateFile(new Uint8Array(2048).fill(0x25), "a.pdf", opts).ok).toBe(false);
  });
  it("refuse les PDF avec JavaScript et les textes contenant du code actif", () => {
    expect(validateFile(bytes("%PDF-1.7 /OpenAction << /S /JavaScript /JS (app.alert(1)) >>"), "a.pdf", opts).ok).toBe(false);
    expect(validateFile(bytes("nom;valeur\n<script>alert(1)</script>"), "a.csv", opts).ok).toBe(false);
  });
  it("refuse les documents Office à macros", () => {
    const zip = new Uint8Array([0x50, 0x4b, 0x03, 0x04, ...new TextEncoder().encode("word/vbaProject.bin")]);
    expect(validateFile(zip, "a.docx", opts).ok).toBe(false);
  });
  it("assainit les noms de fichiers (traversée de répertoire, caractères de contrôle)", () => {
    expect(sanitizeFileName("../../etc/passwd")).toBe("passwd");
    expect(sanitizeFileName("..\\..\\win.ini")).toBe("win.ini");
    expect(sanitizeFileName("a\u0000b<c>.pdf")).toBe("abc.pdf");
    expect(contentDisposition('rap"port.pdf')).not.toMatch(/filename="rap"port/);
  });
});

describe("7. Validation des entrées", () => {
  it("rejette les identifiants, e-mails, SIRET et montants invalides", () => {
    expect(clientSchema.safeParse({ name: "X", category: "entreprise", status: "actif" }).success).toBe(false);
    expect(clientSchema.safeParse({ name: "Client", category: "pirate", status: "actif" }).success).toBe(false);
    expect(clientSchema.safeParse({ name: "Client", category: "entreprise", status: "actif", email: "pas-un-mail" }).success).toBe(false);
    expect(clientSchema.safeParse({ name: "Client", category: "entreprise", status: "actif", siret: "123" }).success).toBe(false);
    expect(lineSchema.safeParse({ description: "x", quantity: -1, unit: "u", unit_price: 1, discount_rate: 0, vat_rate: 20 }).success).toBe(false);
    expect(lineSchema.safeParse({ description: "x", quantity: 1, unit: "u", unit_price: 1, discount_rate: 0, vat_rate: 19.6 }).success).toBe(false);
  });
  it("vérifie la cohérence des dates de mission", () => {
    const base = { client_id: crypto.randomUUID(), service_type: "amoa", title: "Mission", status: "planifiee", progress: 0 };
    expect(missionSchema.safeParse({ ...base, start_date: "2026-05-01", end_date: "2026-04-01" }).success).toBe(false);
  });
  it("PROTECT : refuse une adresse précise et exige le consentement", () => {
    expect(protectSchema.safeParse({ audience: "commerce", answers: {}, department: "12 rue de la Paix", contact: null }).success).toBe(false);
    expect(protectSchema.safeParse({ audience: "commerce", answers: {}, department: "78", contact: { name: "Test", email: "t@exemple.test", consent: false } }).success).toBe(false);
    expect(protectSchema.safeParse({ audience: "commerce", answers: { p1: "oui" }, department: null, contact: null }).success).toBe(false);
  });
  it("12. un lien de partage ne peut pas dépasser 7 jours", () => {
    expect(shareSchema.safeParse({ hours: 169, max_downloads: 1 }).success).toBe(false);
    expect(shareSchema.safeParse({ hours: 168, max_downloads: 1 }).success).toBe(true);
  });
  it("empêche les redirections ouvertes", () => {
    expect(safeInternalPath("https://evil.example")).toBe("/dashboard");
    expect(safeInternalPath("//evil.example")).toBe("/dashboard");
    expect(safeInternalPath("/\\evil.example")).toBe("/dashboard");
    expect(safeInternalPath("/pilot/clients")).toBe("/pilot/clients");
  });
});

describe("9. Les erreurs ne divulguent pas de détails techniques", () => {
  it("traduit les erreurs PostgreSQL en messages génériques", () => {
    const msg = toUserMessage({ code: "42P01", message: 'relation "public.secret_table" does not exist' });
    expect(msg).not.toMatch(/relation|secret_table|public\./);
    expect(toUserMessage({ code: "42501", message: "permission denied for table invoices" })).toBe("Vous n'avez pas les droits nécessaires pour cette opération.");
    expect(toUserMessage({ code: "23514", message: 'new row violates check constraint "x"' })).not.toContain("constraint");
    expect(toUserMessage(new Error("connect ECONNREFUSED 10.0.0.5:5432 password=hunter2"))).not.toMatch(/10\.0|hunter2/);
  });
  it("conserve les messages métier explicites en français", () => {
    expect(toUserMessage({ code: "23514", message: "Seul un brouillon peut être émis" })).toBe("Seul un brouillon peut être émis");
  });
});

describe("10. Les journaux ne contiennent ni mot de passe ni jeton", () => {
  it("masque les clés sensibles et les jetons dans les valeurs", () => {
    const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.c2lnbmF0dXJlX3NpZ25hdHVyZQ";
    const out = JSON.stringify(redact({ password: "Secret123!", user: { access_token: "abc", note: `Bearer ${jwt}` }, key: "sb_secret_abcdef", api: "sk-ant-xyz123", refresh_token: "r" }));
    for (const secret of ["Secret123!", jwt, "sb_secret_abcdef", "sk-ant-xyz123", '"abc"']) expect(out).not.toContain(secret);
  });
});

describe("Permissions (moindre privilège)", () => {
  it("le client n'a accès qu'au portail", () => {
    const granted = (Object.keys(CAPABILITIES) as Array<keyof typeof CAPABILITIES>).filter((c) => can("client", c));
    expect(granted).toEqual(["portal.access"]);
  });
  it("seuls les administrateurs émettent les factures et gèrent les utilisateurs", () => {
    expect(can("collaborator", "finance.issue")).toBe(false);
    expect(can("collaborator", "admin.users")).toBe(false);
    expect(can("admin", "finance.issue")).toBe(true);
    expect(can(null, "workspace.access")).toBe(false);
  });
  it("MFA obligatoire pour les administrateurs ; un admin ne crée pas de super-admin", () => {
    expect(requiresMfa("admin")).toBe(true);
    expect(requiresMfa("super_admin")).toBe(true);
    expect(requiresMfa("collaborator")).toBe(false);
    expect(assignableRoles("admin")).not.toContain("super_admin");
    expect(assignableRoles("collaborator")).toEqual([]);
  });
});

describe("Collecte de veille : SSRF et robots.txt", () => {
  it("refuse les adresses privées, locales et réservées", () => {
    for (const ip of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "fd00::1", "fe80::1", "::ffff:127.0.0.1"]) {
      expect(isForbiddenAddress(ip), ip).toBe(true);
    }
    expect(isForbiddenAddress("93.184.216.34")).toBe(false);
    expect(isForbiddenAddress("2606:4700::6810:85e5")).toBe(false);
  });
  it("respecte Disallow / Allow et les groupes d'agents", () => {
    const robots = "User-agent: *\nDisallow: /prive\nAllow: /prive/public\n\nUser-agent: AutreBot\nDisallow: /";
    expect(robotsAllows(robots, "/feed.xml")).toBe(true);
    expect(robotsAllows(robots, "/prive/rss")).toBe(false);
    expect(robotsAllows(robots, "/prive/public/rss")).toBe(true);
    expect(robotsAllows("User-agent: *\nDisallow: /", "/rss")).toBe(false);
  });
});
