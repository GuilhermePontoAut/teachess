import { BookOpen, Sparkles } from "lucide-react";
import type { CoachRecommendation } from "@/lib/types/chess";
import { errorCategoryLabels } from "./dashboard";

const priorityLabels: Record<CoachRecommendation["priority"], string> = { low: "Baixa", medium: "Média", high: "Alta" };

export function StudyRecommendation({ recommendation }: { recommendation: CoachRecommendation }) {
  return (
    <section aria-labelledby="recommendation-title" className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 p-6 text-white shadow-sm">
      <Sparkles className="absolute -right-6 -top-6 size-32 text-white opacity-[0.04]" aria-hidden="true" />
      <div className="relative">
        <span className="mb-5 flex size-11 items-center justify-center rounded-xl bg-white/10 text-white"><BookOpen size={21} aria-hidden="true" /></span>
        <p className="text-[.7rem] font-bold tracking-[.12em] text-neutral-400 uppercase">Recomendação de estudo</p>
        <h2 id="recommendation-title" className="mt-2 text-xl font-semibold">{recommendation.title}</h2>
        <p className="mt-3 text-sm leading-6 text-neutral-300">{recommendation.description}</p>
        <dl className="mt-5 flex flex-wrap gap-2 text-xs"><div className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5"><dt className="sr-only">Prioridade</dt><dd>Prioridade {priorityLabels[recommendation.priority].toLowerCase()}</dd></div><div className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5"><dt className="sr-only">Tema</dt><dd>{errorCategoryLabels[recommendation.category]}</dd></div></dl>
        <p className="mt-5 border-t border-white/15 pt-4 text-xs leading-5 text-neutral-400">Sugestão simulada com dados de demonstração; nenhuma análise real por IA foi realizada.</p>
      </div>
    </section>
  );
}
