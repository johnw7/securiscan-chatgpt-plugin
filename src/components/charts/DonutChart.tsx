"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartTooltip } from "./ChartTooltip";

export interface DonutDatum {
  name: string;
  value: number;
  color: string;
}

/** Anneau + légende directement étiquetée (valeur et part), pour ne jamais dépendre de la seule couleur. */
export function DonutChart({
  data,
  centerLabel,
  centerValue,
  unit = "%",
  size = 200,
  stacked = false,
}: {
  data: DonutDatum[];
  centerLabel: string;
  centerValue: string;
  unit?: string;
  size?: number;
  /** Légende sous l'anneau (cartes étroites). */
  stacked?: boolean;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className={stacked ? "flex flex-col items-center gap-6" : "flex flex-col items-center gap-6 sm:flex-row sm:items-center"}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={2}
              stroke="#fff"
              strokeWidth={2}
              cornerRadius={4}
              startAngle={90}
              endAngle={-270}
              animationDuration={800}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip unit={unit} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-bold text-navy">{centerValue}</span>
          <span className="text-[11px] text-muted">{centerLabel}</span>
        </div>
      </div>
      <ul className={stacked ? "grid w-full grid-cols-2 gap-x-6 gap-y-3" : "w-full space-y-3"}>
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-3">
            <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: d.color }} />
            <span className="min-w-0 flex-1 truncate text-sm text-slate-600">{d.name}</span>
            <span className="tabular text-sm font-semibold whitespace-nowrap text-navy">
              {Math.round((d.value / total) * 100)} %
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
