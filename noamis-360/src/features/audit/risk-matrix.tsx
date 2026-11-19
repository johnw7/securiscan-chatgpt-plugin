import { cn } from "@/lib/utils";
import { riskLevel, type ScoringMethod } from "./scoring";

const TONE = {
  success: "bg-success/25 text-success",
  gold: "bg-gold/25 text-gold-text",
  warning: "bg-warning/30 text-warning",
  danger: "bg-danger/30 text-danger",
};

/** Matrice vraisemblance × gravité avec le nombre de risques par case. */
export function RiskMatrix({ method, risks }: { method: ScoringMethod; risks: Array<{ likelihood: number; impact: number }> }) {
  const L = Array.from({ length: method.likelihood.max - method.likelihood.min + 1 }, (_, i) => method.likelihood.max - i);
  const I = Array.from({ length: method.impact.max - method.impact.min + 1 }, (_, i) => method.impact.min + i);
  return (
    <figure>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-separate border-spacing-1 text-xs">
          <caption className="sr-only">Matrice des risques : vraisemblance en lignes, gravité en colonnes</caption>
          <thead>
            <tr>
              <th scope="col" className="p-1 text-left font-normal text-muted">Vraisemblance ↓ / Gravité →</th>
              {I.map((i) => (
                <th key={i} scope="col" className="p-1 text-center font-medium text-muted">
                  {i}. {method.impact.labels[i - method.impact.min] ?? ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {L.map((l) => (
              <tr key={l}>
                <th scope="row" className="p-1 text-left font-medium text-muted">
                  {l}. {method.likelihood.labels[l - method.likelihood.min] ?? ""}
                </th>
                {I.map((i) => {
                  const level = riskLevel(method, l * i);
                  const count = risks.filter((r) => r.likelihood === l && r.impact === i).length;
                  return (
                    <td key={i} className={cn("h-12 rounded-md text-center align-middle", TONE[level.tone])}>
                      <span className="block text-base font-semibold">{count || ""}</span>
                      <span className="sr-only">
                        {count} risque(s), score {l * i}, niveau {level.label}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
        {method.levels.map((lv) => (
          <span key={lv.label} className="flex items-center gap-1.5">
            <span className={cn("size-3 rounded-sm", TONE[lv.tone])} aria-hidden /> {lv.label} ({lv.min}–{lv.max})
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
