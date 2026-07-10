"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface ResultDatum { name: string; value: number; color: string }

export function ResultsChart({ wins, losses, draws }: { wins: number; losses: number; draws: number }) {
  const data: ResultDatum[] = [
    { name: "Vitórias", value: wins, color: "var(--success)" },
    { name: "Derrotas", value: losses, color: "var(--danger)" },
    { name: "Empates", value: draws, color: "var(--draw)" },
  ];
  return (
    <section aria-labelledby="results-chart-title" className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
      <p className="section-kicker">Balanço</p>
      <h2 id="results-chart-title" className="text-lg font-semibold text-neutral-950">Resultados</h2>
      <p className="mt-1 text-sm text-muted">Distribuição das partidas registradas.</p>
      <div className="mt-4 h-72 w-full" role="img" aria-label={`Gráfico de resultados: ${wins} vitórias, ${losses} derrotas e ${draws} empates`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={86} paddingAngle={3} stroke="var(--surface)" strokeWidth={3}>
              {data.map((item) => <Cell key={item.name} fill={item.color} />)}
            </Pie>
            <Tooltip formatter={(value) => [Number(value), "Partidas"]} contentStyle={{ border: "1px solid var(--border)", borderRadius: 12, background: "var(--surface)" }} />
            <Legend iconType="circle" formatter={(value) => <span className="text-sm text-neutral-700">{value}</span>} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
