import { Camera, CheckCircle2, FilePen, FileX, PenLine, Play, Plus, UserPlus } from "lucide-react";
import type { ActivityKind } from "@/lib/types";
import { cn } from "@/lib/utils";

const META: Record<ActivityKind, { icon: typeof Camera; className: string }> = {
  intervention_done: { icon: CheckCircle2, className: "bg-emerald-50 text-emerald-600" },
  intervention_created: { icon: Plus, className: "bg-electric-50 text-electric" },
  intervention_started: { icon: Play, className: "bg-cyan-50 text-cyan-700" },
  photos: { icon: Camera, className: "bg-amber-50 text-amber-700" },
  signature: { icon: PenLine, className: "bg-violet-50 text-violet-600" },
  quote_accepted: { icon: FilePen, className: "bg-emerald-50 text-emerald-600" },
  quote_refused: { icon: FileX, className: "bg-rose-50 text-rose-600" },
  client_new: { icon: UserPlus, className: "bg-navy/5 text-navy" },
};

export function ActivityIcon({ kind, className }: { kind: ActivityKind; className?: string }) {
  const { icon: Icon, className: tone } = META[kind];
  return (
    <span className={cn("grid size-8 shrink-0 place-items-center rounded-full ring-4 ring-white", tone, className)}>
      <Icon className="size-4" />
    </span>
  );
}
