"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltip } from "./ChartTooltip";

export function AreaTrendChart({
  data,
  height = 260,
  format,
  name,
}: {
  data: { label: string; value: number }[];
  height?: number;
  format: (value: number) => string;
  name: string;
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 8, left: -4, bottom: 0 }}>
          <defs>
            <linearGradient id="area-brand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0B58FF" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#0B58FF" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="stroke-brand" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#01DAFF" />
              <stop offset="100%" stopColor="#0B58FF" />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#eef1f6" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dy={6} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)} k€`} width={52} />
          <Tooltip cursor={{ stroke: "#0B58FF", strokeOpacity: 0.25, strokeDasharray: "4 4" }} content={<ChartTooltip format={format} />} />
          <Area
            type="monotone"
            dataKey="value"
            name={name}
            stroke="url(#stroke-brand)"
            strokeWidth={2.5}
            fill="url(#area-brand)"
            dot={{ r: 4, fill: "#fff", stroke: "#0B58FF", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: "#0B58FF", stroke: "#fff", strokeWidth: 2 }}
            animationDuration={900}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
