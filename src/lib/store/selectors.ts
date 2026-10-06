import type { AppData, Intervention, ISODate, MemberStatus, Period, TeamMember } from "../types";
import { KPI_BASELINE } from "../data/stats";
import { isInWeek, isSameMonth, startOfWeek } from "../dates";

export const byTime = (a: Intervention, b: Intervention) =>
  `${a.date ?? "9999"}${a.time ?? ""}`.localeCompare(`${b.date ?? "9999"}${b.time ?? ""}`);

export function getClient(data: AppData, id: string) {
  return data.clients.find((c) => c.id === id);
}

export function getMember(data: AppData, id: string | null) {
  return id ? data.team.find((m) => m.id === id) : undefined;
}

export function memberName(member?: TeamMember, short = false) {
  if (!member) return "Non assigné";
  return short ? member.firstName : `${member.firstName} ${member.lastName}`;
}

export function interventionsOn(data: AppData, date: ISODate) {
  return data.interventions.filter((i) => i.date === date && i.status !== "ANNULEE").sort(byTime);
}

function inPeriod(date: ISODate | null, period: Period, today: ISODate) {
  if (!date) return false;
  if (period === "today") return date === today;
  if (period === "week") return isInWeek(date, startOfWeek(today));
  return isSameMonth(date, today);
}

function liveCounts(data: AppData, period: Period, today: ISODate) {
  const list = data.interventions;
  return {
    interventions: list.filter((i) => i.status !== "ANNULEE" && inPeriod(i.date, period, today)).length,
    inProgress: list.filter((i) => i.status === "EN_COURS").length,
    done: list.filter((i) => i.status === "TERMINEE" && inPeriod(i.date, period, today)).length,
    revenue: list
      .filter((i) => i.status === "TERMINEE" && inPeriod(i.date, period === "today" ? "month" : period, today))
      .reduce((sum, i) => sum + i.amount, 0),
  };
}

/**
 * Indicateurs du tableau de bord : historique consolidé de l'entreprise
 * + écart entre l'état actuel et l'état initial de la démo.
 * Créer, démarrer ou terminer une intervention fait donc évoluer les compteurs.
 */
export function computeKpis(data: AppData, seed: AppData, period: Period, today: ISODate) {
  const base = KPI_BASELINE[period];
  const now = liveCounts(data, period, today);
  const initial = liveCounts(seed, period, today);
  return {
    interventions: base.interventions + now.interventions - initial.interventions,
    inProgress: Math.max(0, base.inProgress + now.inProgress - initial.inProgress),
    done: base.done + now.done - initial.done,
    revenue: base.revenue + now.revenue - initial.revenue,
    revenueLabel: base.revenueLabel,
    trends: base.trends,
  };
}

export function memberStatus(data: AppData, member: TeamMember): MemberStatus {
  if (member.appRole !== "technicien") return member.baseStatus;
  return data.interventions.some((i) => i.technicianId === member.id && i.status === "EN_COURS")
    ? "EN_INTERVENTION"
    : "DISPONIBLE";
}

export function memberWeekCount(data: AppData, seed: AppData, member: TeamMember, today: ISODate) {
  if (member.weeklyInterventions === null) return null;
  const week = startOfWeek(today);
  const count = (d: AppData) =>
    d.interventions.filter((i) => i.technicianId === member.id && i.status !== "ANNULEE" && i.date && isInWeek(i.date, week)).length;
  return member.weeklyInterventions + count(data) - count(seed);
}

export function clientInterventionCount(data: AppData, clientId: string) {
  const client = getClient(data, clientId);
  return (client?.pastInterventions ?? 0) + data.interventions.filter((i) => i.clientId === clientId).length;
}

export function clientLastIntervention(data: AppData, clientId: string, today: ISODate) {
  return data.interventions
    .filter((i) => i.clientId === clientId && i.date && i.date <= today && i.status !== "ANNULEE")
    .sort(byTime)
    .at(-1);
}

export function nextInterventionNumber(data: AppData) {
  const max = Math.max(...data.interventions.map((i) => Number(i.id.split("-").at(-1))));
  return max + 1;
}
