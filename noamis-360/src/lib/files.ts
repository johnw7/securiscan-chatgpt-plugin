import { createHash, randomUUID } from "node:crypto";

/**
 * Contrôle des fichiers importés (OWASP File Upload Cheat Sheet) :
 * - liste blanche d'extensions ET de types, vérifiés contre la signature binaire réelle ;
 * - taille maximale ; fichiers vides refusés ;
 * - nom de fichier assaini (le nom de stockage est toujours généré) ;
 * - refus des formats actifs (HTML, SVG, scripts, exécutables, macros Office).
 */
export type FileKind = "pdf" | "png" | "jpeg" | "webp" | "docx" | "xlsx" | "pptx" | "txt" | "csv";

export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

const KINDS: Record<FileKind, { mime: string; ext: string[] }> = {
  pdf: { mime: "application/pdf", ext: ["pdf"] },
  png: { mime: "image/png", ext: ["png"] },
  jpeg: { mime: "image/jpeg", ext: ["jpg", "jpeg"] },
  webp: { mime: "image/webp", ext: ["webp"] },
  docx: { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ext: ["docx"] },
  xlsx: { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ext: ["xlsx"] },
  pptx: { mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", ext: ["pptx"] },
  txt: { mime: "text/plain", ext: ["txt"] },
  csv: { mime: "text/csv", ext: ["csv"] },
};

export const DOCUMENT_KINDS: FileKind[] = ["pdf", "png", "jpeg", "webp", "docx", "xlsx", "pptx", "txt", "csv"];
export const PHOTO_KINDS: FileKind[] = ["png", "jpeg", "webp"];
export { ACCEPT_DOCUMENTS, ACCEPT_PHOTOS } from "./files-client";

const startsWith = (buf: Uint8Array, bytes: number[], offset = 0) => bytes.every((b, i) => buf[offset + i] === b);

/** Détecte le type réel à partir des premiers octets. */
export function sniff(buf: Uint8Array): FileKind | "zip" | "text" | null {
  if (startsWith(buf, [0x25, 0x50, 0x44, 0x46, 0x2d])) return "pdf"; // %PDF-
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  if (startsWith(buf, [0xff, 0xd8, 0xff])) return "jpeg";
  if (startsWith(buf, [0x52, 0x49, 0x46, 0x46]) && startsWith(buf, [0x57, 0x45, 0x42, 0x50], 8)) return "webp";
  if (startsWith(buf, [0x50, 0x4b, 0x03, 0x04])) return "zip"; // conteneur OOXML
  // Texte : UTF-8 valide sans octet nul dans les 4 premiers Ko
  const head = buf.subarray(0, 4096);
  if (head.length && !head.includes(0)) {
    try {
      new TextDecoder("utf-8", { fatal: true }).decode(head);
      return "text";
    } catch {
      return null;
    }
  }
  return null;
}

export function extensionOf(name: string): string {
  const m = /\.([A-Za-z0-9]{1,8})$/.exec(name);
  return m ? m[1]!.toLowerCase() : "";
}

/** Nom affichable sûr (aucun chemin, aucun caractère de contrôle). */
export function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "fichier";
  const cleaned = base
    .normalize("NFKC")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f<>:"|?*]/g, "")
    .replace(/\s+/g, " ")
    .replace(/^\.+/, "")
    .trim();
  return (cleaned || "fichier").slice(0, 150);
}

export type FileCheck =
  | { ok: true; kind: FileKind; mime: string; ext: string; size: number; sha256: string; safeName: string }
  | { ok: false; error: string };

const ACTIVE_CONTENT = /<\s*(script|html|svg|iframe|object|embed)\b|javascript:/i;

export function validateFile(
  bytes: Uint8Array,
  originalName: string,
  options: { allowed: FileKind[]; maxBytes: number },
): FileCheck {
  if (bytes.byteLength === 0) return { ok: false, error: "Fichier vide." };
  if (bytes.byteLength > options.maxBytes) {
    return { ok: false, error: `Fichier trop volumineux (maximum ${Math.round(options.maxBytes / 1024 / 1024)} Mo).` };
  }
  const ext = extensionOf(originalName);
  const kind = (Object.keys(KINDS) as FileKind[]).find((k) => KINDS[k].ext.includes(ext));
  if (!kind || !options.allowed.includes(kind)) {
    return { ok: false, error: "Type de fichier non autorisé." };
  }
  const detected = sniff(bytes);
  const isOoxml = kind === "docx" || kind === "xlsx" || kind === "pptx";
  const isText = kind === "txt" || kind === "csv";
  const consistent = isOoxml ? detected === "zip" : isText ? detected === "text" : detected === kind;
  if (!consistent) return { ok: false, error: "Le contenu du fichier ne correspond pas à son extension." };

  if (isOoxml) {
    // Refus des documents à macros (vbaProject.bin) présents dans l'archive.
    const asText = new TextDecoder("latin1").decode(bytes);
    if (asText.includes("vbaProject.bin")) return { ok: false, error: "Documents contenant des macros refusés." };
  }
  if (isText && ACTIVE_CONTENT.test(new TextDecoder().decode(bytes.subarray(0, 65536)))) {
    return { ok: false, error: "Contenu actif détecté : fichier refusé." };
  }
  if (kind === "pdf") {
    // Les PDF contenant du JavaScript embarqué sont refusés.
    const asText = new TextDecoder("latin1").decode(bytes);
    if (/\/JavaScript|\/JS\s*[(<]|\/Launch/.test(asText)) return { ok: false, error: "PDF contenant du code actif refusé." };
  }

  return {
    ok: true,
    kind,
    mime: KINDS[kind].mime,
    ext: KINDS[kind].ext[0]!,
    size: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    safeName: sanitizeFileName(originalName),
  };
}

/** Chemin de stockage non devinable, sans donnée issue de l'utilisateur. */
export function storagePath(organizationId: string, scope: string, ext: string): string {
  return `${organizationId}/${scope}/${randomUUID()}.${ext}`;
}

/** Disposition « attachment » sûre (RFC 6266 / 5987). */
export function contentDisposition(fileName: string, inline = false): string {
  const ascii = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `${inline ? "inline" : "attachment"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}
