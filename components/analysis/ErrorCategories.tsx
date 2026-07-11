import type { ErrorCategory, GameAnalysis } from "@/lib/types/chess";
import { errorCategoryLabels } from "@/lib/utils/analysis";

const guidance: Record<ErrorCategory, string> = { opening: "Desenvolva peças e proteja o rei.", tactics: "Revise padrões e ameaças forçadas.", strategy: "Compare planos antes de alterar a estrutura.", time_management: "Defina marcos para o uso do relógio.", calculation: "Liste xeques, capturas e ameaças.", endgame: "Ative rei e peças no momento certo." };

export function ErrorCategories({ analysis }: { analysis: GameAnalysis }) {
  const counts = analysis.errorCategories.reduce<Map<ErrorCategory, number>>((map, category) => map.set(category, (map.get(category) ?? 0) + 1), new Map());
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1] || errorCategoryLabels[a[0]].localeCompare(errorCategoryLabels[b[0]], "pt-BR"));
  const total = analysis.errorCategories.length;
  return <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6" aria-labelledby="categories-title"><h2 id="categories-title" className="text-xl font-semibold">Categorias de erro</h2><p className="mt-2 text-sm text-muted">Frequência simulada baseada exclusivamente nos dados mockados desta análise.</p>{sorted.length ? <ul className="mt-5 space-y-4">{sorted.map(([category, count]) => { const weight = total ? Math.round(count / total * 100) : 0; return <li key={category}><div className="flex items-end justify-between gap-3"><div><h3 className="text-sm font-semibold">{errorCategoryLabels[category]}</h3><p className="mt-1 text-xs text-muted">{guidance[category]}</p></div><span className="shrink-0 text-xs font-semibold">{count} · {weight}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-200" role="progressbar" aria-label={`Peso simulado de ${errorCategoryLabels[category]}`} aria-valuenow={weight} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-neutral-800" style={{ width: `${weight}%` }} /></div></li>; })}</ul> : <p className="mt-5 rounded-xl bg-neutral-100 p-4 text-sm text-muted">Nenhuma categoria informada.</p>}</section>;
}
