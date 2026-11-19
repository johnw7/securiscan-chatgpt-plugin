"use client";
import { Award, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { ActionButton } from "@/components/ui/action-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { cn, formatEUR } from "@/lib/utils";
import { saveOfferScores, selectOffer } from "./actions";
import { rankOffers, totalWeight, type Criterion, type Offer } from "./comparison";

/** Tableau comparatif éditable : notes /10 par critère, note pondérée et classement en direct. */
export function ScoreGrid({
  projectId,
  criteria,
  offers,
  selectedId,
  readOnly,
}: {
  projectId: string;
  criteria: Criterion[];
  offers: Offer[];
  selectedId: string | null;
  readOnly: boolean;
}) {
  const router = useRouter();
  const [scores, setScores] = React.useState(() => Object.fromEntries(offers.map((o) => [o.id, { ...o.scores }])));
  const [saving, setSaving] = React.useState<string | null>(null);
  const live = offers.map((o) => ({ ...o, scores: scores[o.id] ?? {} }));
  const ranked = rankOffers(live, criteria);
  const rankOf = new Map(ranked.map((r) => [r.id, r]));
  const weight = totalWeight(criteria);

  async function save(offerId: string) {
    setSaving(offerId);
    const result = await saveOfferScores(projectId, { offerId, scores: scores[offerId] ?? {} });
    setSaving(null);
    if (result.ok) {
      toast.success("Notes enregistrées");
      router.refresh();
    } else toast.error(result.error);
  }

  if (!criteria.length || !offers.length) {
    return <p className="text-sm text-muted">Ajoutez au moins un critère et une offre pour établir le comparatif.</p>;
  }

  return (
    <div className="space-y-3">
      {weight !== 100 && <p className="text-xs text-warning">Somme des poids : {weight} % (100 % recommandé ; la note pondérée est normalisée).</p>}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[640px] text-sm">
          <caption className="sr-only">Comparatif des offres selon les critères pondérés</caption>
          <thead>
            <tr className="border-b border-border bg-surface-2 text-left text-xs uppercase text-muted">
              <th scope="col" className="px-3 py-3">Critère (poids)</th>
              {offers.map((o) => (
                <th key={o.id} scope="col" className={cn("px-3 py-3", o.id === selectedId && "text-gold-text")}>
                  {o.vendor}
                  {o.id === selectedId && <Award className="ml-1 inline size-3.5" aria-label="Offre retenue" />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/60">
              <th scope="row" className="px-3 py-2 text-left font-normal text-muted">Montant HT</th>
              {offers.map((o) => (
                <td key={o.id} className="px-3 py-2 tabular-nums">{formatEUR(o.amount_ht)}<span className="block text-xs text-muted">Indice prix suggéré : {rankOf.get(o.id)?.priceIndex ?? "—"}/10</span></td>
              ))}
            </tr>
            <tr className="border-b border-border/60">
              <th scope="row" className="px-3 py-2 text-left font-normal text-muted">Délai</th>
              {offers.map((o) => <td key={o.id} className="px-3 py-2">{o.delay_weeks !== null ? `${o.delay_weeks} sem.` : "—"}</td>)}
            </tr>
            {criteria.map((c) => (
              <tr key={c.id} className="border-b border-border/60">
                <th scope="row" className="px-3 py-2 text-left font-normal">{c.label} <span className="text-muted">({c.weight} %)</span></th>
                {offers.map((o) => (
                  <td key={o.id} className="px-3 py-2">
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      step={0.5}
                      inputMode="decimal"
                      className="h-8 w-20"
                      aria-label={`Note de ${o.vendor} pour ${c.label} (sur 10)`}
                      disabled={readOnly}
                      value={scores[o.id]?.[c.id] ?? ""}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setScores((prev) => {
                          const next = { ...(prev[o.id] ?? {}) };
                          if (raw === "") delete next[c.id];
                          else next[c.id] = Math.min(10, Math.max(0, Number(raw)));
                          return { ...prev, [o.id]: next };
                        });
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
            <tr className="bg-gold/5">
              <th scope="row" className="px-3 py-3 text-left">Note pondérée /10 · rang</th>
              {offers.map((o) => {
                const r = rankOf.get(o.id)!;
                return (
                  <td key={o.id} className="px-3 py-3">
                    <span className="text-lg font-semibold tabular-nums">{r.weighted.toFixed(2)}</span>{" "}
                    <Badge tone={r.rank === 1 ? "gold" : "neutral"}>#{r.rank}</Badge>
                    {!r.complete && <span className="block text-xs text-warning">Notation incomplète</span>}
                  </td>
                );
              })}
            </tr>
            {!readOnly && (
              <tr>
                <td className="px-3 py-3" />
                {offers.map((o) => (
                  <td key={o.id} className="space-y-2 px-3 py-3">
                    <Button size="sm" variant="secondary" loading={saving === o.id} onClick={() => save(o.id)}><Save /> Enregistrer</Button>
                    {o.id !== selectedId && (
                      <ActionButton
                        size="sm"
                        variant="outline"
                        action={() => selectOffer(projectId, o.id)}
                        confirm={{ title: `Retenir l'offre de ${o.vendor} ?`, description: "La décision sera consignée dans l'historique du projet. Le client contracte directement avec le prestataire.", confirmLabel: "Retenir" }}
                      >
                        <Award /> Retenir
                      </ActionButton>
                    )}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
