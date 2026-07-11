"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { EvaluationPoint } from "@/lib/types/chess";

export function EvaluationChart({ data }: { data: EvaluationPoint[] }) {
  return <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6" aria-labelledby="evaluation-title"><h2 id="evaluation-title" className="text-xl font-semibold">Avaliação ao longo da partida</h2><p className="mt-2 text-sm leading-6 text-muted">A avaliação apresentada é simulada e serve apenas para demonstrar a futura experiência de análise. Valores positivos favorecem as brancas; negativos, as pretas.</p>
    {data.length ? <div className="mt-5 h-72 min-w-0" aria-label="Gráfico de avaliação simulada"><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 8, right: 12, bottom: 8, left: -16 }}><CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" /><XAxis dataKey="move" tick={{ fontSize: 12 }} label={{ value: "Lance", position: "insideBottomRight", offset: -4 }} /><YAxis tick={{ fontSize: 12 }} /><ReferenceLine y={0} stroke="#737373" strokeWidth={2} /><Tooltip formatter={(value) => [typeof value === "number" ? value.toFixed(2) : "Não informado", "Avaliação simulada"]} labelFormatter={(label) => `Lance ${label}`} contentStyle={{ borderRadius: 12, borderColor: "#d4d4d4" }} /><Line type="monotone" dataKey="evaluation" stroke="#171717" strokeWidth={3} dot={{ r: 3, fill: "#fff", stroke: "#171717" }} activeDot={{ r: 5 }} /></LineChart></ResponsiveContainer></div> : <div className="mt-5 rounded-xl border border-dashed border-line-strong bg-neutral-50 p-8 text-center text-sm text-muted">Histórico de avaliação não informado para esta demonstração.</div>}
  </section>;
}
