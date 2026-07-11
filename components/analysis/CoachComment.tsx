import { GraduationCap } from "lucide-react";
import type { CoachRecommendation, GameAnalysis } from "@/lib/types/chess";

export function CoachComment({ analysis, recommendation }: { analysis: GameAnalysis; recommendation?: CoachRecommendation }) {
  return <section className="rounded-2xl bg-neutral-950 p-5 text-white shadow-sm sm:p-6" aria-labelledby="coach-title"><div className="flex flex-wrap items-center justify-between gap-3"><h2 id="coach-title" className="flex items-center gap-2 text-xl font-semibold"><GraduationCap aria-hidden="true" />Comentário simulado do professor</h2><span className="rounded-full border border-neutral-500 px-3 py-1 text-xs font-semibold">Simulado</span></div><dl className="mt-5 grid gap-4 md:grid-cols-2"><Item label="Leitura resumida" value={analysis.summary} /><Item label="Principal aprendizado" value={analysis.weaknesses[0] ? `Transforme “${analysis.weaknesses[0]}” em um tema concreto de revisão.` : "Revise as decisões críticas com calma."} /><Item label="Sugestão de estudo" value={recommendation?.description ?? analysis.recommendation} /><Item label="Próximo passo recomendado" value={recommendation?.actionLabel ?? "Reproduzir a partida lance a lance"} /></dl></section>;
}

function Item({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-white/10 p-4"><dt className="text-xs font-semibold text-neutral-300">{label}</dt><dd className="mt-2 text-sm leading-6 text-neutral-100">{value}</dd></div>; }
