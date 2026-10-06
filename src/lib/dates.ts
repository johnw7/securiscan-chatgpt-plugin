import type { ISODate, ISODateTime } from "./types";

const pad = (n: number) => String(n).padStart(2, "0");

/** Date locale au format ISO (sans conversion UTC, pour éviter les décalages de fuseau). */
export function toISODate(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function toISODateTime(d: Date): ISODateTime {
  return `${toISODate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

export function fromISODate(iso: ISODate): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO(): ISODate {
  return toISODate(new Date());
}

export function nowTime(): string {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function addDays(iso: ISODate, days: number): ISODate {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function isWeekend(iso: ISODate): boolean {
  const day = fromISODate(iso).getDay();
  return day === 0 || day === 6;
}

/** Décale d'un nombre de jours ouvrés (lundi → vendredi). */
export function addBusinessDays(iso: ISODate, days: number): ISODate {
  if (days === 0) return iso;
  const step = days > 0 ? 1 : -1;
  let remaining = Math.abs(days);
  let current = iso;
  while (remaining > 0) {
    current = addDays(current, step);
    if (!isWeekend(current)) remaining -= 1;
  }
  return current;
}

/** Lundi de la semaine contenant la date. */
export function startOfWeek(iso: ISODate): ISODate {
  const d = fromISODate(iso);
  const day = (d.getDay() + 6) % 7; // 0 = lundi
  return addDays(iso, -day);
}

export function startOfMonth(iso: ISODate): ISODate {
  return `${iso.slice(0, 7)}-01`;
}

export function isSameMonth(a: ISODate, b: ISODate): boolean {
  return a.slice(0, 7) === b.slice(0, 7);
}

export function isInWeek(iso: ISODate, weekStart: ISODate): boolean {
  return iso >= weekStart && iso <= addDays(weekStart, 6);
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function formatDate(iso: ISODate | null, style: "short" | "long" | "medium" = "medium"): string {
  if (!iso) return "—";
  const d = fromISODate(iso);
  if (style === "short") {
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
  }
  if (style === "long") {
    return capitalize(
      d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    );
  }
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export function formatWeekday(iso: ISODate, style: "long" | "short" = "long"): string {
  return capitalize(fromISODate(iso).toLocaleDateString("fr-FR", { weekday: style }));
}

export function formatMonth(iso: ISODate, style: "long" | "short" = "long"): string {
  return capitalize(
    fromISODate(iso).toLocaleDateString("fr-FR", style === "long" ? { month: "long", year: "numeric" } : { month: "short" }),
  );
}

export function formatDateTime(iso: ISODateTime): string {
  const [date, time] = iso.split("T");
  return `${formatDate(date)} · ${time.slice(0, 5)}`;
}

/** « il y a 12 min », « hier », etc. */
export function formatRelative(iso: ISODateTime, now: Date = new Date()): string {
  const [date, time] = iso.split("T");
  const [h, m] = time.split(":").map(Number);
  const d = fromISODate(date);
  d.setHours(h, m);
  const diffMin = Math.round((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24 && toISODate(now) === date) return `il y a ${diffH} h`;
  const diffDays = Math.round((fromISODate(toISODate(now)).getTime() - fromISODate(date).getTime()) / 86400000);
  if (diffDays === 1) return `hier · ${time.slice(0, 5)}`;
  if (diffDays < 7) return `il y a ${diffDays} jours`;
  return formatDate(date);
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${pad(m)}`;
}

export function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;
}
