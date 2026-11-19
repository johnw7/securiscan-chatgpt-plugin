"use client";
import { AlertDialog, Dialog as D } from "radix-ui";
import { X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

const overlay = "fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0";
const content =
  "fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-surface p-6 shadow-2xl scrollbar-thin";

export function Dialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  size = "md",
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const width = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" }[size];
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <D.Trigger asChild>{trigger}</D.Trigger>}
      <D.Portal>
        <D.Overlay className={overlay} />
        <D.Content className={cn(content, width)} aria-describedby={description ? undefined : undefined}>
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <D.Title className="font-display text-2xl font-semibold text-foreground">{title}</D.Title>
              {description ? (
                <D.Description className="mt-1 text-sm text-muted">{description}</D.Description>
              ) : (
                <D.Description className="sr-only">{title}</D.Description>
              )}
            </div>
            <D.Close asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Fermer">
                <X />
              </Button>
            </D.Close>
          </div>
          {children}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

/** Fenêtre de confirmation (actions sensibles ou irréversibles). */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Confirmer",
  tone = "primary",
  onConfirm,
}: {
  trigger: React.ReactNode;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  tone?: "primary" | "danger";
  onConfirm: () => void | Promise<void>;
}) {
  const [pending, setPending] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className={overlay} />
        <AlertDialog.Content className={cn(content, "max-w-md")}>
          <AlertDialog.Title className="font-display text-xl font-semibold">{title}</AlertDialog.Title>
          <AlertDialog.Description asChild>
            <div className="mt-2 text-sm text-muted">{description}</div>
          </AlertDialog.Description>
          <div className="mt-6 flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <Button variant="secondary">Annuler</Button>
            </AlertDialog.Cancel>
            <Button
              variant={tone === "danger" ? "danger" : "primary"}
              loading={pending}
              onClick={async () => {
                setPending(true);
                try {
                  await onConfirm();
                  setOpen(false);
                } finally {
                  setPending(false);
                }
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
