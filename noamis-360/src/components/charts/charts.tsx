"use client";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const GOLD = "#C7A15B";
const GOLD_LIGHT = "#E5C27B";
const GRID = "var(--border)";
const AXIS = "var(--muted)";
const PALETTE = [GOLD, GOLD_LIGHT, "#7FB2E8", "#5EC38F", "#E8B45A", "#AFAFAF"];

const eur = (v: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);

function ChartTooltip({ active, payload, label, money }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string; money?: boolean }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-medium text-foreground">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-muted">
          {p.name} : <span className="text-foreground">{money ? eur(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  );
}

/** Histogramme mensuel (ex. chiffre d'affaires facturé). Table de données équivalente fournie pour l'accessibilité. */
export function MonthlyBarChart({ data, label, money = true }: { data: Array<{ month: string; value: number }>; label: string; money?: boolean }) {
  return (
    <figure>
      <div className="h-64" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="month" tick={{ fill: AXIS, fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: AXIS, fontSize: 12 }} axisLine={false} tickLine={false} width={70} tickFormatter={(v) => (money ? eur(v) : String(v))} />
            <Tooltip cursor={{ fill: "color-mix(in srgb, var(--gold) 10%, transparent)" }} content={<ChartTooltip money={money} />} />
            <Bar dataKey="value" name={label} fill={GOLD} radius={[6, 6, 0, 0]} maxBarSize={36} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">
        {label} : {data.map((d) => `${d.month} ${money ? eur(d.value) : d.value}`).join(", ")}
      </figcaption>
    </figure>
  );
}

export function DonutChart({ data, label }: { data: Array<{ name: string; value: number }>; label: string }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <figure className="flex flex-col items-center gap-4">
      <div className="h-48 w-48 shrink-0" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={2} stroke="none" isAnimationActive={false}>
              {data.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="w-full">
        <span className="sr-only">{label}</span>
        <ul className="space-y-1.5 text-sm">
          {data.map((d, i) => (
            <li key={d.name} className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} aria-hidden />
              <span className="flex-1 text-muted">{d.name}</span>
              <span className="tabular-nums text-foreground">{d.value}</span>
              <span className="w-10 text-right text-xs tabular-nums text-muted">{total ? Math.round((d.value / total) * 100) : 0} %</span>
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}
