import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
export function formatEUR(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  return eur.format(typeof value === "string" ? Number(value) : value);
}

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Paris" });
const dateTimeFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris",
});
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value.length === 10 ? `${value}T12:00:00Z` : value) : value;
  return Number.isNaN(d.getTime()) ? "—" : dateFmt.format(d);
}
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(d.getTime()) ? "—" : dateTimeFmt.format(d);
}

/** Date du jour (fuseau Europe/Paris) au format AAAA-MM-JJ. */
export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

/** Chemins internes uniquement (anti open-redirect). */
export function safeInternalPath(path: string | null | undefined, fallback = "/dashboard"): string {
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return fallback;
  return path;
}
