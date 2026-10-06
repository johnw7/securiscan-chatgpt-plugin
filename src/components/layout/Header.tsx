"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Bell, Menu, PlayCircle, Search } from "lucide-react";
import { BRAND } from "@/config/brand";
import { formatRelative } from "@/lib/dates";
import { useStore, useStoreReady } from "@/lib/store/AppStore";
import { Avatar } from "@/components/ui/Avatar";
import { useDemo } from "@/components/demo/DemoProvider";
import { cn } from "@/lib/utils";
import { ActivityIcon } from "./ActivityIcon";
import { LogoMark } from "./Logo";

function Notifications() {
  const { data } = useStore();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const latest = data.activities[0]?.id ?? null;
  const unread = latest !== seen ? Math.min(3, data.activities.length) : 0;

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((o) => !o);
          setSeen(latest);
        }}
        className="relative grid size-10 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-navy"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 grid size-4 place-items-center rounded-full bg-electric text-[9px] font-bold text-white ring-2 ring-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute top-12 right-0 z-50 w-[min(360px,calc(100vw-24px))] animate-scale-in overflow-hidden rounded-2xl border border-line bg-white shadow-pop">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-semibold text-navy">Notifications</p>
            <span className="text-xs text-muted">Temps réel</span>
          </div>
          <ul className="scrollbar-thin max-h-96 overflow-y-auto py-1">
            {data.activities.slice(0, 8).map((a) => (
              <li key={a.id}>
                <Link
                  href={a.href ?? "/"}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 px-4 py-2.5 transition hover:bg-slate-50"
                >
                  <ActivityIcon kind={a.kind} className="size-7 ring-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] leading-snug text-ink">{a.text}</span>
                    <span className="text-[11px] text-muted">{formatRelative(a.at)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function Header({ onMenu }: { onMenu: () => void }) {
  const router = useRouter();
  const ready = useStoreReady();
  const demo = useDemo();
  const [query, setQuery] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/interventions?q=${encodeURIComponent(query.trim())}`);
    setQuery("");
  };

  return (
    <header className="no-print sticky top-0 z-40 border-b border-line/80 bg-white/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
        <button
          onClick={onMenu}
          className="grid size-10 place-items-center rounded-xl text-navy transition hover:bg-slate-100 lg:hidden"
          aria-label="Ouvrir le menu"
        >
          <Menu className="size-5" />
        </button>
        <Link href="/" className="lg:hidden" aria-label="Accueil">
          <LogoMark className="size-8" />
        </Link>

        <form onSubmit={submit} className="relative hidden max-w-md flex-1 md:block">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une intervention, un client…"
            aria-label="Recherche globale"
            className="h-10 w-full rounded-xl border border-transparent bg-slate-100/80 pr-3 pl-9 text-sm transition placeholder:text-slate-400 focus:border-electric/40 focus:bg-white focus:ring-4 focus:ring-electric/10 focus:outline-none"
          />
        </form>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <span className="hidden rounded-full border border-dashed border-slate-300 px-2.5 py-1 text-[10.5px] font-medium text-slate-400 xl:inline">
            {BRAND.demoNotice}
          </span>
          <button
            onClick={demo.active ? demo.stop : demo.start}
            disabled={!ready}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-bold tracking-[0.08em] uppercase transition sm:px-4",
              demo.active
                ? "bg-navy text-white hover:bg-navy-800"
                : "bg-brand-gradient text-white shadow-glow hover:brightness-110",
            )}
          >
            <PlayCircle className={cn("size-4", demo.active && "animate-pulse-soft text-cyan-brand")} />
            <span className="hidden sm:inline">{demo.active ? "Quitter la démo" : "Mode démo"}</span>
            <span className="sm:hidden">Démo</span>
          </button>
          {ready && <Notifications />}
          <div className="ml-1 hidden items-center gap-2.5 border-l border-line pl-3 sm:flex">
            <Avatar name="Alexandre Rousset" color="#021448" size="sm" status="online" />
            <div className="hidden leading-tight lg:block">
              <p className="text-[13px] font-semibold text-navy">Alexandre R.</p>
              <p className="text-[11px] text-muted">Dirigeant</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
