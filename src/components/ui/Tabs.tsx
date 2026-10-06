"use client";

import { cn } from "@/lib/utils";

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div role="tablist" className={cn("no-scrollbar flex gap-1 overflow-x-auto border-b border-line", className)}>
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              "relative inline-flex shrink-0 items-center gap-2 px-3.5 pt-2 pb-3 text-xs font-semibold tracking-wide uppercase transition",
              active ? "text-electric" : "text-slate-500 hover:text-navy",
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn("tabular rounded-md px-1.5 py-px text-[10.5px]", active ? "bg-electric-50" : "bg-slate-100")}>{tab.count}</span>
            )}
            <span
              className={cn(
                "absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-gradient transition-opacity",
                active ? "opacity-100" : "opacity-0",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
