import {
  CalendarDays,
  ChartColumn,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Settings,
  Building2,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: "toPlan" | "pendingQuotes";
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Tableau de bord", href: "/", icon: LayoutDashboard },
  { label: "Clients", href: "/clients", icon: Building2 },
  { label: "Interventions", href: "/interventions", icon: Wrench, badge: "toPlan" },
  { label: "Planning", href: "/planning", icon: CalendarDays },
  { label: "Équipe", href: "/equipe", icon: Users },
  { label: "Devis", href: "/devis", icon: FileText, badge: "pendingQuotes" },
  { label: "Documents", href: "/documents", icon: FolderOpen },
  { label: "Statistiques", href: "/statistiques", icon: ChartColumn },
  { label: "Paramètres", href: "/parametres", icon: Settings },
];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
