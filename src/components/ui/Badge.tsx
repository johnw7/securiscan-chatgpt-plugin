import type { ReactNode } from "react";
import type { Tone } from "@/lib/constants";
import { cn } from "@/lib/utils";

const TONES: Record<Tone, { badge: string; dot: string }> = {
  blue: { badge: "bg-electric-50 text-electric ring-electric/15", dot: "bg-electric" },
  cyan: { badge: "bg-cyan-50 text-cyan-800 ring-cyan-600/20", dot: "bg-cyan-500" },
  green: { badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/15", dot: "bg-emerald-500" },
  amber: { badge: "bg-amber-50 text-amber-800 ring-amber-600/20", dot: "bg-amber-500" },
  red: { badge: "bg-rose-50 text-rose-700 ring-rose-600/15", dot: "bg-rose-500" },
  slate: { badge: "bg-slate-100 text-slate-600 ring-slate-500/15", dot: "bg-slate-400" },
  violet: { badge: "bg-violet-50 text-violet-700 ring-violet-600/15", dot: "bg-violet-500" },
  navy: { badge: "bg-navy/5 text-navy ring-navy/15", dot: "bg-navy" },
};

export function Badge({
  tone = "slate",
  children,
  dot = true,
  pulse,
  size = "sm",
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  dot?: boolean;
  pulse?: boolean;
  size?: "xs" | "sm" | "md";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full font-semibold uppercase tracking-wide ring-1 ring-inset",
        size === "xs" && "px-2 py-0.5 text-[10px]",
        size === "sm" && "px-2.5 py-1 text-[10.5px]",
        size === "md" && "px-3 py-1.5 text-xs",
        TONES[tone].badge,
        className,
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", TONES[tone].dot, pulse && "animate-pulse-soft")} />}
      {children}
    </span>
  );
}
