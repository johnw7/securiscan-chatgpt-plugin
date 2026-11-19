"use client";
import { useRouter } from "next/navigation";
import * as React from "react";
import type { ActionResult } from "@/lib/errors";
import { Button, type ButtonProps } from "./button";
import { ConfirmDialog } from "./dialog";
import { Select } from "./input";
import { toast } from "./toaster";

type AnyAction = () => Promise<ActionResult<{ id?: string } | undefined>>;

/**
 * Bouton déclenchant une Server Action (avec confirmation optionnelle),
 * notification du résultat et rafraîchissement des données.
 */
export function ActionButton({
  action,
  confirm,
  successMessage = "Opération effectuée",
  redirectTo,
  children,
  ...buttonProps
}: Omit<ButtonProps, "onClick" | "action"> & {
  action: AnyAction;
  confirm?: { title: string; description: React.ReactNode; confirmLabel?: string; danger?: boolean };
  successMessage?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [pending, start] = React.useTransition();

  const run = () =>
    new Promise<void>((resolve) =>
      start(async () => {
        const result = await action();
        if (result.ok) {
          toast.success(result.message ?? successMessage);
          if (redirectTo) router.push(redirectTo.replace(":id", result.data?.id ?? ""));
          else router.refresh();
        } else {
          toast.error(result.error);
        }
        resolve();
      }),
    );

  if (confirm) {
    return (
      <ConfirmDialog
        title={confirm.title}
        description={confirm.description}
        confirmLabel={confirm.confirmLabel}
        tone={confirm.danger ? "danger" : "primary"}
        onConfirm={run}
        trigger={
          <Button {...buttonProps} loading={pending}>
            {children}
          </Button>
        }
      />
    );
  }
  return (
    <Button {...buttonProps} loading={pending} onClick={run}>
      {children}
    </Button>
  );
}

/** Liste déroulante qui enregistre immédiatement la valeur choisie. */
export function InlineSelect({
  value,
  options,
  action,
  label,
  className,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  action: (value: string) => Promise<ActionResult<unknown>>;
  label: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [current, setCurrent] = React.useState(value);
  React.useEffect(() => setCurrent(value), [value]);
  return (
    <Select
      aria-label={label}
      className={className ?? "h-8 w-auto py-0 text-xs"}
      value={current}
      disabled={pending}
      options={options}
      onChange={(e) => {
        const next = e.target.value;
        const previous = current;
        setCurrent(next);
        start(async () => {
          const result = await action(next);
          if (!result.ok) {
            setCurrent(previous);
            toast.error(result.error);
          } else {
            toast.success("Mis à jour");
            router.refresh();
          }
        });
      }}
    />
  );
}
