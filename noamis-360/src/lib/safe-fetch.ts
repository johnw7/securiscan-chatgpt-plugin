import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * Récupération HTTP sortante sécurisée (veille) :
 * - HTTPS uniquement, port 443 ;
 * - refus des adresses privées, locales ou réservées (protection SSRF), y compris après redirection ;
 * - délai et taille de réponse bornés ;
 * - respect du fichier robots.txt du site (aucun contournement des protections).
 */
const USER_AGENT = "NOAMIS360-Veille/1.0 (+outil de veille interne; respecte robots.txt)";
const MAX_BYTES = 2 * 1024 * 1024;
const TIMEOUT_MS = 10_000;

export class FetchPolicyError extends Error {}

function isPrivateIPv4(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number) as [number, number];
  return (
    a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19)) || a >= 224
  );
}

function isPrivateIPv6(ip: string): boolean {
  const v = ip.toLowerCase();
  if (v === "::" || v === "::1") return true;
  if (v.startsWith("::ffff:")) return isPrivateIPv4(v.slice(7));
  return v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe8") || v.startsWith("fe9") || v.startsWith("fea") || v.startsWith("feb") || v.startsWith("ff");
}

export function isForbiddenAddress(ip: string): boolean {
  const family = isIP(ip);
  if (family === 4) return isPrivateIPv4(ip);
  if (family === 6) return isPrivateIPv6(ip);
  return true;
}

async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new FetchPolicyError("URL invalide");
  }
  if (url.protocol !== "https:") throw new FetchPolicyError("Seules les adresses HTTPS sont autorisées");
  if (url.port && url.port !== "443") throw new FetchPolicyError("Port non autorisé");
  if (url.username || url.password) throw new FetchPolicyError("Identifiants dans l'URL interdits");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) throw new FetchPolicyError("Hôte interne interdit");
  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true, verbatim: true }).catch(() => []);
  if (!addresses.length) throw new FetchPolicyError("Nom de domaine introuvable");
  if (addresses.some((a) => isForbiddenAddress(a.address))) throw new FetchPolicyError("Adresse réseau privée ou réservée interdite");
  return url;
}

async function readLimited(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      await reader.cancel();
      throw new FetchPolicyError("Réponse trop volumineuse");
    }
    chunks.push(value);
  }
  return new TextDecoder("utf-8").decode(Buffer.concat(chunks));
}

export async function safeFetchText(raw: string, accept = "*/*"): Promise<{ status: number; text: string; finalUrl: string }> {
  let url = await assertPublicUrl(raw);
  for (let hop = 0; hop < 4; hop++) {
    const res = await fetch(url, {
      redirect: "manual",
      headers: { "User-Agent": USER_AGENT, Accept: accept },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      url = await assertPublicUrl(new URL(res.headers.get("location")!, url).toString());
      continue;
    }
    return { status: res.status, text: res.ok ? await readLimited(res) : "", finalUrl: url.toString() };
  }
  throw new FetchPolicyError("Trop de redirections");
}

/** Interprétation simple de robots.txt (groupes « * » et agent NOAMIS, directives Disallow/Allow). */
export function robotsAllows(robotsTxt: string, path: string, agent = "noamis360-veille"): boolean {
  type Group = { agents: string[]; rules: Array<{ allow: boolean; prefix: string }> };
  const groups: Group[] = [];
  let current: Group | null = null;
  let lastWasAgent = false;
  for (const line of robotsTxt.split(/\r?\n/)) {
    const clean = line.replace(/#.*/, "").trim();
    const m = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(clean);
    if (!m) continue;
    const key = m[1]!.toLowerCase();
    const value = m[2]!.trim();
    if (key === "user-agent") {
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else if ((key === "disallow" || key === "allow") && current) {
      lastWasAgent = false;
      if (value) current.rules.push({ allow: key === "allow", prefix: value.replace(/\*.*$/, "") });
    } else {
      lastWasAgent = false;
    }
  }
  const specific = groups.filter((g) => g.agents.some((a) => a !== "*" && agent.includes(a)));
  const applicable = specific.length ? specific : groups.filter((g) => g.agents.includes("*"));
  let best: { allow: boolean; prefix: string } | null = null;
  for (const rule of applicable.flatMap((g) => g.rules)) {
    if (path.startsWith(rule.prefix) && (!best || rule.prefix.length > best.prefix.length)) best = rule;
  }
  return best ? best.allow : true;
}

/** Vérifie robots.txt avant toute collecte (absence de robots.txt = autorisé). */
export async function checkRobots(target: string): Promise<boolean> {
  const url = new URL(target);
  try {
    const { status, text } = await safeFetchText(`${url.origin}/robots.txt`, "text/plain");
    if (status === 404 || status === 410) return true;
    if (status >= 400) return false; // en cas de doute, on s'abstient
    return robotsAllows(text, url.pathname + url.search);
  } catch (e) {
    if (e instanceof FetchPolicyError) throw e;
    return false;
  }
}
