"use client";

interface TooltipEntry {
  name?: string | number;
  value?: number | string;
  color?: string;
  payload?: { fill?: string; color?: string };
}

export function ChartTooltip({
  active,
  payload,
  label,
  format = (v) => v.toLocaleString("fr-FR"),
  unit,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  format?: (value: number) => string;
  unit?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 shadow-pop">
      {label !== undefined && <p className="mb-1 text-[11px] font-semibold text-muted">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="flex items-center gap-2 text-[13px] text-ink">
          <span className="size-2 rounded-full" style={{ background: entry.payload?.fill ?? entry.color }} />
          {payload.length > 1 || !label ? <span className="text-slate-500">{entry.name}</span> : null}
          <strong className="tabular">
            {format(Number(entry.value))}
            {unit ? ` ${unit}` : ""}
          </strong>
        </p>
      ))}
    </div>
  );
}
