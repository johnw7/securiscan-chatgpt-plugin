"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { BRAND } from "@/config/brand";
import { useStoreReady } from "@/lib/store/AppStore";
import { useDemo } from "@/components/demo/DemoProvider";
import { cn } from "@/lib/utils";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

function LoadingState() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Chargement">
      <div className="h-10 w-72 animate-pulse rounded-xl bg-slate-200/70" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-white shadow-card" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-2xl bg-white shadow-card" />
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [drawer, setDrawer] = useState(false);
  const pathname = usePathname();
  const ready = useStoreReady();
  const demo = useDemo();

  useEffect(() => setDrawer(false), [pathname]);

  return (
    <div className="min-h-dvh">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[264px] lg:block">
        <Sidebar />
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-[55] lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-navy/50 backdrop-blur-sm" onClick={() => setDrawer(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] animate-slide-in-left shadow-pop">
            <Sidebar onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-[264px]">
        <Header onMenu={() => setDrawer(true)} />
        <main className={cn("mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8", demo.active && "pb-36")}>
          {ready ? children : <LoadingState />}
        </main>
        <footer className="no-print px-4 pb-6 text-center text-[11px] text-slate-400 sm:px-6 lg:px-8">
          {BRAND.demoNotice} · Entreprises, personnes, adresses et données entièrement fictives.
        </footer>
      </div>
    </div>
  );
}
