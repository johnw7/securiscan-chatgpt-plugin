"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltip } from "./ChartTooltip";

export interface BarDatum {
  label: string;
  value: number;
  highlight?: boolean;
}

/** Barres verticales mono-série ; la barre mise en avant porte la couleur pleine. */
export function BarVolumeChart({
  data,
  height = 240,
  unit,
  format,
}: {
  data: BarDatum[];
  height?: number;
  unit?: string;
  format?: (value: number) => string;
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 4, left: -18, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke="#eef1f6" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dy={6} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} allowDecimals={false} tickFormatter={format} width={format ? 56 : 40} />
          <Tooltip cursor={{ fill: "rgba(11,88,255,0.05)", radius: 8 }} content={<ChartTooltip unit={unit} format={format} />} />
          <Bar dataKey="value" name="Interventions" radius={[6, 6, 0, 0]} maxBarSize={44} animationDuration={700}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.highlight ? "#0B58FF" : "#B9CDFE"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
