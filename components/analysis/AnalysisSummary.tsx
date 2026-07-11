import { AlertTriangle, Crosshair, Gauge, Lightbulb } from "lucide-react";
import type { GameAnalysis } from "@/lib/types/chess";
import { errorCategoryLabels } from "@/lib/utils/analysis";

export function AnalysisSummary({ analysis }: { analysis: GameAnalysis }) {
  const categories = [...new Set(analysis.errorCategories)].map((item) => errorCategoryLabels[item]);
  const items = [{ icon: Gauge, label: "Precisão simulada", value: `${analysis.simulatedAccuracy.toFixed(1)}%` }, { icon: AlertTriangle, label: "Momentos críticos", value: String(analysis.criticalMoments.length) }, { icon: Crosshair, label: "Categorias principais", value: categories.join(", ") || "Não informado" }];
  return <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6" aria-labelledby="summary-title"><div className="flex flex-wrap items-center justify-between gap-2"><h2 id="summary-title" className="text-xl font-semibold">Resumo da análise</h2><span className="rounded-full bg-neutral-950 px-3 py-1 text-xs font-semibold text-white">Valores simulados</span></div><p className="mt-3 text-sm leading-6 text-neutral-700">{analysis.summary}</p><dl className="mt-5 grid gap-3 sm:grid-cols-3">{items.map(({ icon: Icon, label, value }) => <div key={label} className="rounded-xl bg-neutral-100 p-4"><Icon size={18} aria-hidden="true" /><dt className="mt-3 text-xs text-muted">{label}</dt><dd className="mt-1 text-sm font-semibold">{value}</dd></div>)}</dl><div className="mt-4 flex gap-3 rounded-xl border border-line p-4"><Lightbulb className="shrink-0" size={19} aria-hidden="true" /><div><h3 className="text-sm font-semibold">Recomendação principal</h3><p className="mt-1 text-sm leading-6 text-neutral-700">{analysis.recommendation}</p></div></div></section>;
}
