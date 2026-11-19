import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/labels";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-3 text-muted border-border",
  gold: "bg-gold/12 text-gold-text border-gold/35",
  success: "bg-success/12 text-success border-success/35",
  warning: "bg-warning/12 text-warning border-warning/35",
  danger: "bg-danger/12 text-danger border-danger/35",
  info: "bg-info/12 text-info border-info/35",
};

export function Badge({ tone = "neutral", className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ map, value }: { map: Record<string, { label: string; tone: Tone }>; value: string | null | undefined }) {
  if (!value) return <span className="text-muted">—</span>;
  const entry = map[value];
  return <Badge tone={entry?.tone ?? "neutral"}>{entry?.label ?? value}</Badge>;
}
