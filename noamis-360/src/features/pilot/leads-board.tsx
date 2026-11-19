"use client";
import Link from "next/link";
import { Pencil, UserCheck } from "lucide-react";
import { ActionButton, InlineSelect } from "@/components/ui/action-button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/ui/entity-form";
import { LEAD_SOURCES, LEAD_STAGES, LEAD_STAGE_ORDER, optionsOf } from "@/lib/labels";
import { formatDate, formatEUR } from "@/lib/utils";
import { convertLead, saveLead, setLeadStage } from "./actions";
import { leadFields } from "./fields";

export type LeadCard = {
  id: string; title: string; company: string | null; contact_name: string | null; email: string | null; phone: string | null;
  category: string | null; source: string; stage: string; estimated_amount: number | null; probability: number | null;
  expected_close_date: string | null; owner_id: string | null; message: string | null; lost_reason: string | null; client_id: string | null; owner: string | null;
};

export function LeadsBoard({ leads, staff }: { leads: LeadCard[]; staff: Array<{ value: string; label: string }> }) {
  return (
    <div className="grid auto-cols-[minmax(260px,1fr)] grid-flow-col gap-4 overflow-x-auto pb-4 scrollbar-thin">
      {LEAD_STAGE_ORDER.map((stage) => {
        const items = leads.filter((l) => l.stage === stage);
        const total = items.reduce((s, l) => s + (l.estimated_amount ?? 0), 0);
        return (
          <section key={stage} aria-labelledby={`col-${stage}`} className="flex min-h-64 flex-col rounded-xl border border-border bg-surface/60">
            <header className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 id={`col-${stage}`} className="text-sm font-semibold">
                <StatusBadge map={LEAD_STAGES} value={stage} /> <span className="ml-1 text-muted">{items.length}</span>
              </h2>
              <span className="text-xs tabular-nums text-muted">{formatEUR(total)}</span>
            </header>
            <ul className="flex-1 space-y-3 p-3">
              {items.map((l) => (
                <li key={l.id} className="rounded-lg border border-border bg-surface p-3 shadow-card">
                  <p className="font-medium leading-snug">{l.title}</p>
                  <p className="mt-0.5 text-xs text-muted">{[l.company, l.contact_name].filter(Boolean).join(" · ") || "—"}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge tone={l.source === "protect" ? "gold" : "neutral"}>{LEAD_SOURCES[l.source]?.label ?? l.source}</Badge>
                    {l.estimated_amount !== null && <Badge tone="info">{formatEUR(l.estimated_amount)}{l.probability !== null ? ` · ${l.probability} %` : ""}</Badge>}
                  </div>
                  {l.expected_close_date && <p className="mt-2 text-xs text-muted">Signature prévue : {formatDate(l.expected_close_date)}</p>}
                  <div className="mt-3 flex items-center gap-1.5">
                    <InlineSelect label={`Étape de ${l.title}`} value={l.stage} options={optionsOf(LEAD_STAGES)} action={(v) => setLeadStage(l.id, v)} />
                    <FormDialog
                      title="Modifier l'opportunité"
                      size="lg"
                      trigger={<Button variant="ghost" size="icon-sm" aria-label={`Modifier ${l.title}`}><Pencil /></Button>}
                      schema="lead"
                      fields={leadFields(staff)}
                      defaultValues={l}
                      hidden={{ id: l.id }}
                      action={saveLead}
                    />
                    {l.client_id ? (
                      <Button asChild variant="ghost" size="icon-sm" aria-label="Voir la fiche client"><Link href={`/pilot/clients/${l.client_id}`}><UserCheck /></Link></Button>
                    ) : (
                      (stage === "gagne" || stage === "negociation") && (
                        <ActionButton
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Convertir en client"
                          action={() => convertLead(l.id)}
                          redirectTo="/pilot/clients/:id"
                          confirm={{ title: "Convertir en client ?", description: "Une fiche client et un contact principal seront créés à partir de ce prospect.", confirmLabel: "Convertir" }}
                        >
                          <UserCheck />
                        </ActionButton>
                      )
                    )}
                  </div>
                </li>
              ))}
              {!items.length && <li className="px-1 py-6 text-center text-xs text-muted">Aucune opportunité</li>}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
