import {
  BarChart3, Bell, BookOpen, Briefcase, CalendarDays, ClipboardCheck, FileText, FolderLock, Gauge, Handshake,
  KanbanSquare, LayoutDashboard, ListChecks, MessagesSquare, Newspaper, Radar, Receipt, ScrollText, Settings,
  ShieldCheck, Stamp, Users, Wallet, type LucideIcon,
} from "lucide-react";
import type { Capability } from "@/lib/permissions";

export type NavItem = { href: string; label: string; icon: LucideIcon; capability?: Capability };
export type NavGroup = { label: string; module?: string; items: NavItem[] };

export const STAFF_NAV: NavGroup[] = [
  { label: "Direction", items: [{ href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard }] },
  {
    label: "Pilot",
    module: "NOAMIS PILOT",
    items: [
      { href: "/pilot/clients", label: "Clients & contacts", icon: Users },
      { href: "/pilot/leads", label: "Pipeline commercial", icon: KanbanSquare },
      { href: "/pilot/missions", label: "Missions", icon: Briefcase },
      { href: "/pilot/tasks", label: "Tâches & échéances", icon: ListChecks },
      { href: "/pilot/calendar", label: "Calendrier", icon: CalendarDays },
    ],
  },
  {
    label: "Métier",
    items: [
      { href: "/audit", label: "Audit de sûreté", icon: ClipboardCheck },
      { href: "/project", label: "Projets AMOA", icon: Handshake },
      { href: "/intelligence", label: "Intelligence & veille", icon: Radar },
    ],
  },
  {
    label: "Services",
    items: [
      { href: "/docs", label: "Documents", icon: FolderLock },
      { href: "/finance", label: "Finance", icon: Wallet, capability: "finance.view" },
      { href: "/connect", label: "Portail clients", icon: MessagesSquare },
      { href: "/protect", label: "Diagnostics PROTECT", icon: ShieldCheck },
    ],
  },
  {
    label: "Administration",
    items: [
      { href: "/admin/users", label: "Utilisateurs", icon: Settings, capability: "admin.users" },
      { href: "/admin/organization", label: "Organisation", icon: Stamp, capability: "admin.organization" },
      { href: "/admin/audit-logs", label: "Journal d'audit", icon: ScrollText, capability: "admin.audit_logs" },
    ],
  },
];

export const CLIENT_NAV: NavGroup[] = [
  {
    label: "Mon espace",
    items: [
      { href: "/portal", label: "Accueil", icon: Gauge },
      { href: "/portal/missions", label: "Mes missions", icon: Briefcase },
      { href: "/portal/documents", label: "Mes documents", icon: FileText },
      { href: "/portal/approvals", label: "Validations", icon: ClipboardCheck },
      { href: "/portal/finance", label: "Devis & factures", icon: Receipt },
      { href: "/portal/messages", label: "Messagerie", icon: MessagesSquare },
      { href: "/portal/reports", label: "Suivi & veille", icon: Newspaper },
      { href: "/portal/history", label: "Historique", icon: BookOpen },
    ],
  },
];

export const ICONS = { Bell, BarChart3 };
