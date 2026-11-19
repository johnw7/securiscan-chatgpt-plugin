"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import * as React from "react";
import { can, type Role } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { CLIENT_NAV, STAFF_NAV } from "./nav";
import { Logo } from "./logo";

function NavLinks({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const pathname = usePathname();
  const groups = role === "client" ? CLIENT_NAV : STAFF_NAV;
  return (
    <nav aria-label="Navigation principale" className="flex-1 space-y-6 overflow-y-auto px-3 py-4 scrollbar-thin">
      {groups.map((group) => {
        const items = group.items.filter((i) => !i.capability || can(role, i.capability));
        if (!items.length) return null;
        return (
          <div key={group.label}>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted/80">{group.module ?? group.label}</p>
            <ul className="space-y-0.5">
              {items.map((item) => {
                const active =
                  pathname === item.href || (item.href !== "/portal" && item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        active ? "bg-gold/12 text-foreground" : "text-muted hover:bg-surface-2 hover:text-foreground",
                      )}
                    >
                      <item.icon className={cn("size-4 shrink-0", active ? "text-gold" : "text-muted group-hover:text-gold-text")} aria-hidden />
                      <span className="truncate">{item.label}</span>
                      {active && <span className="ml-auto h-4 w-0.5 rounded-full bg-gold" aria-hidden />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

export function Sidebar({ role, organizationName }: { role: Role; organizationName: string }) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  React.useEffect(() => setOpen(false), [pathname]);

  const content = (
    <>
      <div className="flex h-16 items-center border-b border-border px-5">
        <Link href={role === "client" ? "/portal" : "/dashboard"} aria-label="Accueil NOAMIS 360°">
          <Logo />
        </Link>
      </div>
      <NavLinks role={role} onNavigate={() => setOpen(false)} />
      <div className="border-t border-border px-5 py-3 text-xs text-muted">
        <p className="truncate">{organizationName}</p>
        <p className="mt-0.5 text-[11px] text-muted/80">{role === "client" ? "NOAMIS CONNECT" : "Espace NOAMIS"}</p>
      </div>
    </>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-surface lg:flex">{content}</aside>
      <button
        type="button"
        className="fixed left-3 top-3 z-40 rounded-lg border border-border bg-surface p-2 text-foreground lg:hidden no-print"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
        aria-expanded={open}
      >
        <Menu className="size-5" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} aria-hidden />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col border-r border-border bg-surface">
            <button
              type="button"
              className="absolute right-3 top-4 rounded-md p-1.5 text-muted hover:text-foreground"
              onClick={() => setOpen(false)}
              aria-label="Fermer le menu"
            >
              <X className="size-5" />
            </button>
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
