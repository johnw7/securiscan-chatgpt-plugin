"use client";

import { Mic } from "lucide-react";
import type { Intervention } from "@/lib/types";
import { useAppActions } from "@/lib/store/useAppActions";
import { Textarea } from "@/components/ui/Field";

export function ReportEditor({ intervention, disabled }: { intervention: Intervention; disabled?: boolean }) {
  const actions = useAppActions();
  return (
    <div>
      <label className="flex flex-col gap-1.5">
        <span className="flex items-center justify-between text-[13px] font-medium text-slate-700">
          Observations du technicien
          <span className="inline-flex items-center gap-1 text-[11px] font-normal text-muted">
            <Mic className="size-3" /> Dictée vocale : clavier du smartphone
          </span>
        </span>
        <Textarea
          value={intervention.report}
          onChange={(e) => actions.setReport(intervention.id, e.target.value)}
          disabled={disabled}
          rows={5}
          placeholder="Constats, travaux réalisés, pièces remplacées, recommandations…"
        />
      </label>
      <p className="mt-2 text-xs text-muted">Enregistrement automatique · joint au rapport PDF envoyé au client.</p>
    </div>
  );
}
