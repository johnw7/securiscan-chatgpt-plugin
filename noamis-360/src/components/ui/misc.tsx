import type { LucideIcon } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold-text">{eyebrow}</p>}
        <h1 className="font-display text-3xl font-semibold leading-tight text-foreground">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "gold",
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  tone?: "gold" | "success" | "warning" | "danger" | "info";
}) {
  const toneClass = {
    gold: "text-gold-text bg-gold/10",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
    danger: "text-danger bg-danger/10",
    info: "text-info bg-info/10",
  }[tone];
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted">{label}</p>
        {Icon && (
          <span className={cn("rounded-lg p-2", toneClass)} aria-hidden>
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border border-dashed border-border-strong px-6 py-12 text-center", className)}>
      {Icon && (
        <span className="mb-3 rounded-full bg-gold/10 p-3 text-gold-text" aria-hidden>
          <Icon className="size-6" />
        </span>
      )}
      <p className="font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-md text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-surface-3", className)} aria-hidden />;
}

export function LoadingPage({ label = "Chargement…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="space-y-4">
      <span className="sr-only">{label}</span>
      <Skeleton className="h-9 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}

export function Progress({ value, label }: { value: number; label?: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3"
        role="progressbar"
        aria-valuenow={v}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Avancement"}
      >
        <div className="h-full rounded-full bg-gradient-to-r from-gold to-gold-light" style={{ width: `${v}%` }} />
      </div>
      <span className="w-10 text-right text-xs tabular-nums text-muted">{v} %</span>
    </div>
  );
}

export function DefinitionList({ items }: { items: Array<{ label: string; value: React.ReactNode }> }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map((i) => (
        <div key={i.label} className="min-w-0">
          <dt className="text-xs uppercase tracking-wide text-muted">{i.label}</dt>
          <dd className="mt-0.5 break-words text-sm text-foreground">{i.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Notice({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "warning" | "danger" | "gold";
  title?: string;
  children: React.ReactNode;
}) {
  const cls = {
    info: "border-info/40 bg-info/8 text-foreground",
    warning: "border-warning/40 bg-warning/8 text-foreground",
    danger: "border-danger/40 bg-danger/8 text-foreground",
    gold: "border-gold/40 bg-gold/8 text-foreground",
  }[tone];
  return (
    <div className={cn("rounded-lg border px-4 py-3 text-sm", cls)} role={tone === "danger" ? "alert" : "note"}>
      {title && <p className="mb-0.5 font-semibold">{title}</p>}
      <div className="text-muted">{children}</div>
    </div>
  );
}
