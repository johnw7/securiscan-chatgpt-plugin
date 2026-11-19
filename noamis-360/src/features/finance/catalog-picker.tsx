"use client";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Select } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import type { ActionResult } from "@/lib/errors";

/** Ajout rapide d'une ligne depuis le catalogue de prestations. */
export function CatalogPicker({ catalog, action }: { catalog: Array<{ value: string; label: string }>; action: (itemId: string) => Promise<ActionResult> }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return (
    <Select
      aria-label="Ajouter une prestation du catalogue"
      className="h-8 w-56 py-0 text-xs"
      value=""
      disabled={pending}
      placeholder="+ Depuis le catalogue…"
      options={catalog}
      onChange={(e) => {
        const id = e.target.value;
        if (!id) return;
        start(async () => {
          const r = await action(id);
          if (r.ok) {
            toast.success("Ligne ajoutée");
            router.refresh();
          } else toast.error(r.error);
        });
      }}
    />
  );
}
