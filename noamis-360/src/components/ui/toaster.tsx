"use client";
import { Toaster as Sonner, toast } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      closeButton
      toastOptions={{
        classNames: {
          toast: "!bg-surface !border !border-border !text-foreground !shadow-2xl",
          description: "!text-muted",
          success: "[&_[data-icon]]:!text-success",
          error: "[&_[data-icon]]:!text-danger",
        },
      }}
    />
  );
}

export { toast };

/** Affiche le résultat d'une Server Action. Renvoie true si succès. */
export function notifyResult(result: { ok: boolean; error?: string; message?: string }, success = "Enregistré") {
  if (result.ok) toast.success(result.message ?? success);
  else toast.error(result.error ?? "Erreur");
  return result.ok;
}
