import type { ReactNode } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "./AnimatedNumber";
import { Card } from "./Card";

export function StatCard({
  label,
  value,
  format,
  icon,
  trend,
  trendLabel = "vs période précédente",
  invertTrend,
  accent,
  suffix,
  className,
  style,
}: {
  label: string;
  value: number;
  format?: (v: number) => string;
  icon: ReactNode;
  trend?: number;
  trendLabel?: string;
  /** Une baisse est positive (ex. temps moyen d'intervention). */
  invertTrend?: boolean;
  accent?: boolean;
  suffix?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const positive = trend !== undefined && (invertTrend ? trend <= 0 : trend >= 0);
  return (
    <Card
      interactive
      style={style}
      className={cn(
        "relative animate-fade-up overflow-hidden p-5",
        accent && "border-transparent bg-navy text-white",
        className,
      )}
    >
      {accent && <div className="pointer-events-none absolute -top-16 -right-16 size-44 rounded-full bg-brand-gradient opacity-40 blur-2xl" />}
      <div className="relative flex items-start justify-between gap-3">
        <p className={cn("text-[11px] font-semibold tracking-[0.08em] uppercase", accent ? "text-white/70" : "text-muted")}>{label}</p>
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-xl",
            accent ? "bg-white/10 text-cyan-brand" : "bg-electric-50 text-electric",
          )}
        >
          {icon}
        </span>
      </div>
      <div className={cn("relative mt-2 flex items-baseline gap-1 font-display text-[30px] leading-none font-bold", accent ? "text-white" : "text-navy")}>
        <AnimatedNumber value={value} format={format} />
        {suffix}
      </div>
      {trend !== undefined && (
        <div className="relative mt-3 flex items-center gap-2 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold",
              positive
                ? accent ? "bg-emerald-400/15 text-emerald-300" : "bg-emerald-50 text-emerald-700"
                : accent ? "bg-rose-400/15 text-rose-300" : "bg-rose-50 text-rose-700",
            )}
          >
            {trend >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {trend > 0 ? "+" : ""}
            {trend.toLocaleString("fr-FR")} %
          </span>
          <span className={accent ? "text-white/60" : "text-muted"}>{trendLabel}</span>
        </div>
      )}
    </Card>
  );
}
