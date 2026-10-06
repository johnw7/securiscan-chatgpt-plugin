import { AlertTriangle, ArrowUp, Minus } from "lucide-react";
import { PRIORITY_META, STATUS_META, TYPE_META } from "@/lib/constants";
import type { InterventionStatus, InterventionType, Priority } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, size, label }: { status: InterventionStatus; size?: "xs" | "sm" | "md"; label?: string }) {
  const meta = STATUS_META[status];
  return (
    <Badge tone={meta.tone} size={size} pulse={status === "EN_COURS"}>
      {label ?? meta.label}
    </Badge>
  );
}

export function PriorityBadge({ priority, size = "sm" }: { priority: Priority; size?: "xs" | "sm" }) {
  const meta = PRIORITY_META[priority];
  const Icon = priority === "URGENTE" ? AlertTriangle : priority === "IMPORTANTE" ? ArrowUp : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md font-semibold tracking-wide whitespace-nowrap uppercase",
        size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-[10.5px]",
        priority === "URGENTE" && "bg-rose-50 text-rose-700",
        priority === "IMPORTANTE" && "bg-amber-50 text-amber-800",
        priority === "NORMALE" && "bg-slate-100 text-slate-500",
      )}
    >
      <Icon className="size-3" />
      {meta.label}
    </span>
  );
}

export function TypeTag({ type, className }: { type: InterventionType; className?: string }) {
  const meta = TYPE_META[type];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-slate-600", className)}>
      <span className="size-2 rounded-[3px]" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}
