"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RatingPoint } from "./dashboard";

const formatDate = (value: string) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(`${value}T12:00:00`));

export function RatingChart({ data }: { data: RatingPoint[] }) {
  return (
    <section aria-labelledby="rating-chart-title" className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
      <p className="section-kicker">Desempenho</p>
      <h2 id="rating-chart-title" className="text-lg font-semibold text-neutral-950">Evolução do rating</h2>
      <p className="mt-1 text-sm text-muted">Evolução oficial: somente partidas da plataforma.</p>
      <div className="mt-6 h-72 w-full" role="img" aria-label="Gráfico de linha da evolução do rating por data">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fill: "var(--text-muted)", fontSize: 12 }} tickLine={false} axisLine={false} minTickGap={24} />
            <YAxis domain={["dataMin - 20", "dataMax + 20"]} tick={{ fill: "var(--text-muted)", fontSize: 12 }} tickLine={false} axisLine={false} width={44} />
            <Tooltip labelFormatter={(label) => formatDate(String(label))} formatter={(value) => [Number(value), "Rating"]} contentStyle={{ border: "1px solid var(--border)", borderRadius: 12, background: "var(--surface)", color: "var(--foreground)" }} />
            <Line type="monotone" dataKey="rating" name="Rating" stroke="var(--foreground)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--surface)", stroke: "var(--foreground)", strokeWidth: 2 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
