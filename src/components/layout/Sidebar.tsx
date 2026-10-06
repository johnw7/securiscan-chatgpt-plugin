"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Smartphone } from "lucide-react";
import { BRAND } from "@/config/brand";
import { useStore, useStoreReady } from "@/lib/store/AppStore";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { isActive, NAV_ITEMS, type NavItem } from "./nav";

function NavBadge({ kind }: { kind: NonNullable<NavItem["badge"]> }) {
  const { data } = useStore();
  const count =
    kind === "toPlan"
      ? data.interventions.filter((i) => i.status === "A_PLANIFIER").length
      : data.quotes.filter((q) => q.status === "EN_ATTENTE").length;
  if (!count) return null;
  return (
    <span className="tabular ml-auto rounded-md bg-white/10 px-1.5 py-0.5 text-[10.5px] font-semibold text-white/80 group-data-[active=true]:bg-white/20 group-data-[active=true]:text-white">
      {count}
    </span>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const ready = useStoreReady();

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-navy text-white">
      <div className="pointer-events-none absolute -top-24 -left-24 size-64 rounded-full bg-electric opacity-25 blur-3xl" />
      <div className="relative px-5 pt-6 pb-7">
        <Link href="/" onClick={onNavigate} aria-label="E-DUST Intervention — tableau de bord">
          <Logo dark />
        </Link>
      </div>

      <nav className="scrollbar-thin relative flex-1 overflow-y-auto px-3" aria-label="Navigation principale">
        <p className="px-3 pb-2 text-[10px] font-semibold tracking-[0.18em] text-white/35 uppercase">Gestion</p>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  data-active={active}
                  className={cn(
                    "group relative flex h-10 items-center gap-3 rounded-xl px-3 text-[12.5px] font-semibold tracking-[0.06em] uppercase transition",
                    active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white",
                  )}
                >
                  {active && <span className="absolute top-2 bottom-2 left-0 w-[3px] rounded-r-full bg-brand-gradient" />}
                  <Icon className={cn("size-[18px] shrink-0", active ? "text-cyan-brand" : "text-white/50 group-hover:text-white/80")} />
                  {item.label}
                  {item.badge && ready && <NavBadge kind={item.badge} />}
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="px-3 pt-6 pb-2 text-[10px] font-semibold tracking-[0.18em] text-white/35 uppercase">Terrain</p>
        <Link
          href="/technicien"
          onClick={onNavigate}
          className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 transition hover:border-cyan-brand/40 hover:bg-white/[0.07]"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-brand-gradient">
            <Smartphone className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-semibold">Vue technicien</span>
            <span className="block text-[11px] text-white/50">Application mobile</span>
          </span>
          <ArrowUpRight className="size-4 text-white/40 transition group-hover:text-cyan-brand" />
        </Link>
      </nav>

      <div className="relative border-t border-white/10 px-5 py-4">
        <p className="text-[11px] text-white/45">Une solution</p>
        <p className="font-display text-[13px] font-bold tracking-wide">
          <span className="text-brand-gradient">{BRAND.vendor}</span>
        </p>
      </div>
    </div>
  );
}
