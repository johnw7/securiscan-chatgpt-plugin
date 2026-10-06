"use client";

import { Check } from "lucide-react";
import type { Intervention } from "@/lib/types";
import { useAppActions } from "@/lib/store/useAppActions";
import { Progress } from "@/components/ui/Progress";
import { cn } from "@/lib/utils";

export function Checklist({ intervention, disabled, large }: { intervention: Intervention; disabled?: boolean; large?: boolean }) {
  const actions = useAppActions();
  const done = intervention.checklist.filter((c) => c.done).length;
  const total = intervention.checklist.length;

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <Progress value={(done / total) * 100} tone={done === total ? "green" : "brand"} />
        <span className="tabular shrink-0 text-xs font-semibold text-slate-500">
          {done}/{total}
        </span>
      </div>
      <ul className="space-y-2">
        {intervention.checklist.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => actions.toggleChecklist(intervention.id, item.id)}
              aria-pressed={item.done}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border text-left transition duration-150 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60",
                large ? "min-h-14 px-4 py-3" : "min-h-11 px-3.5 py-2.5",
                item.done ? "border-emerald-200 bg-emerald-50/60" : "border-line bg-white hover:border-electric/40",
              )}
            >
              <span
                className={cn(
                  "grid shrink-0 place-items-center rounded-md border-2 transition duration-150",
                  large ? "size-6" : "size-5",
                  item.done ? "scale-100 border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-white text-transparent",
                )}
              >
                <Check className={large ? "size-4" : "size-3.5"} strokeWidth={3} />
              </span>
              <span className={cn("font-medium", large ? "text-[15px]" : "text-sm", item.done ? "text-emerald-900" : "text-ink")}>
                {item.label}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
