"use client";
import { DropdownMenu as DM } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/utils";

export const DropdownMenu = DM.Root;
export const DropdownTrigger = DM.Trigger;

export function DropdownContent({ className, ...props }: React.ComponentProps<typeof DM.Content>) {
  return (
    <DM.Portal>
      <DM.Content
        sideOffset={6}
        align="end"
        className={cn("z-50 min-w-48 rounded-lg border border-border bg-surface p-1 shadow-2xl", className)}
        {...props}
      />
    </DM.Portal>
  );
}

export function DropdownItem({ className, ...props }: React.ComponentProps<typeof DM.Item>) {
  return (
    <DM.Item
      className={cn(
        "flex cursor-pointer select-none items-center gap-2 rounded-md px-2.5 py-2 text-sm text-foreground outline-none data-[highlighted]:bg-surface-2 [&_svg]:size-4 [&_svg]:text-muted",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownLabel({ className, ...props }: React.ComponentProps<typeof DM.Label>) {
  return <DM.Label className={cn("px-2.5 py-1.5 text-xs text-muted", className)} {...props} />;
}

export function DropdownSeparator() {
  return <DM.Separator className="my-1 h-px bg-border" />;
}
