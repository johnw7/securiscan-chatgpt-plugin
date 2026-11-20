"use client";
import { Tabs as T } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/utils";

export function Tabs({
  tabs,
  defaultValue,
  className,
}: {
  tabs: Array<{ value: string; label: React.ReactNode; content: React.ReactNode; count?: number }>;
  defaultValue?: string;
  className?: string;
}) {
  const [value, setValue] = React.useState(defaultValue ?? tabs[0]?.value);
  React.useEffect(() => {
    // Synchronisation avec un système externe (ancre de l'URL), inaccessible au rendu serveur.
    const apply = () => {
      const hash = window.location.hash.slice(1);
      if (hash && tabs.some((t) => t.value === hash)) setValue(hash);
    };
     
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, [tabs]);
  return (
    <T.Root
      value={value}
      onValueChange={(v) => {
        setValue(v);
        history.replaceState(null, "", `#${v}`);
      }}
      className={className}
    >
      <T.List className="mb-5 flex gap-1 overflow-x-auto border-b border-border scrollbar-thin" aria-label="Sections">
        {tabs.map((t) => (
          <T.Trigger
            key={t.value}
            value={t.value}
            className="relative -mb-px whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm text-muted transition-colors hover:text-foreground data-[state=active]:border-gold data-[state=active]:text-foreground"
          >
            {t.label}
            {t.count !== undefined && (
              <span className="ml-1.5 rounded-full bg-surface-3 px-1.5 py-0.5 text-[11px] tabular-nums text-muted">{t.count}</span>
            )}
          </T.Trigger>
        ))}
      </T.List>
      {tabs.map((t) => (
        <T.Content key={t.value} value={t.value} className={cn("focus-visible:outline-none")}>
          {t.content}
        </T.Content>
      ))}
    </T.Root>
  );
}
