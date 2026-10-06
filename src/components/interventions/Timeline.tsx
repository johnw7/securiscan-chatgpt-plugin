import { Camera, CheckCircle2, ClipboardCheck, FileText, MapPin, PenLine, Play, Plus, Search, XCircle, CalendarCheck } from "lucide-react";
import type { TimelineEvent, TimelineKind } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS: Record<TimelineKind, { icon: typeof Camera; className: string }> = {
  created: { icon: Plus, className: "bg-slate-100 text-slate-500" },
  scheduled: { icon: CalendarCheck, className: "bg-electric-50 text-electric" },
  arrived: { icon: MapPin, className: "bg-electric-50 text-electric" },
  started: { icon: Play, className: "bg-cyan-50 text-cyan-700" },
  diagnostic: { icon: Search, className: "bg-violet-50 text-violet-600" },
  photo: { icon: Camera, className: "bg-amber-50 text-amber-700" },
  checklist: { icon: ClipboardCheck, className: "bg-electric-50 text-electric" },
  report: { icon: FileText, className: "bg-slate-100 text-slate-600" },
  signature: { icon: PenLine, className: "bg-violet-50 text-violet-600" },
  completed: { icon: CheckCircle2, className: "bg-emerald-50 text-emerald-600" },
  cancelled: { icon: XCircle, className: "bg-rose-50 text-rose-600" },
};

export function InterventionTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="relative space-y-4">
      {events.map((event, i) => {
        const { icon: Icon, className } = ICONS[event.kind];
        const last = i === events.length - 1;
        return (
          <li key={event.id} className="relative flex animate-fade-up gap-3" style={{ animationDelay: `${i * 40}ms` }}>
            {!last && <span className="absolute top-8 bottom-[-16px] left-[15px] w-px bg-line" aria-hidden />}
            <span className={cn("relative grid size-8 shrink-0 place-items-center rounded-full ring-4 ring-white", className)}>
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 pt-1">
              <p className="tabular text-xs font-bold text-navy">{event.time}</p>
              <p className="text-sm text-slate-600">{event.label}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
