import { AlertCircle } from "lucide-react";
import type { CriticalMoment } from "@/lib/types/chess";
import { errorCategoryLabels } from "@/lib/utils/analysis";

const severityLabels = { inaccuracy: "Imprecisão", mistake: "Erro", blunder: "Erro grave" } as const;

export function CriticalMomentCard({ moment, player, selected, onSelect }: { moment: CriticalMoment; player: string; selected: boolean; onSelect: () => void }) {
  const impact = moment.evaluationAfter - moment.evaluationBefore;
  return <button type="button" onClick={onSelect} aria-pressed={selected} className={`w-full rounded-2xl border p-5 text-left shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${selected ? "border-neutral-950 bg-neutral-100 ring-1 ring-neutral-950" : "border-line bg-surface hover:border-neutral-500"}`}><div className="flex flex-wrap items-center justify-between gap-2"><span className="inline-flex items-center gap-2 text-sm font-semibold"><AlertCircle size={18} aria-hidden="true" />Lance {moment.moveNumber} · {player}</span><span className="rounded-full border border-neutral-400 px-2.5 py-1 text-xs font-semibold">{severityLabels[moment.severity]}</span></div><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><Item label="Lance jogado" value={moment.move} /><Item label="Categoria" value={errorCategoryLabels[moment.category]} /><Item label="Alternativa sugerida na demonstração" value={moment.suggestion} /><Item label="Impacto simulado" value={`${impact >= 0 ? "+" : ""}${impact.toFixed(1)} pontos`} /></dl><div className="mt-4 rounded-xl bg-white p-4"><p className="text-xs font-semibold text-muted">Comentário simulado do professor</p><p className="mt-1 text-sm leading-6 text-neutral-700">{moment.description}</p></div></button>;
}

function Item({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs text-muted">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>; }
