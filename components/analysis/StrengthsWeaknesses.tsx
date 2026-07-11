import { CheckCircle2, TrendingUp } from "lucide-react";
import type { GameAnalysis } from "@/lib/types/chess";

export function StrengthsWeaknesses({ analysis }: { analysis: GameAnalysis }) {
  return <section className="grid gap-4 md:grid-cols-2" aria-label="Pontos fortes e pontos a melhorar"><List title="Pontos fortes" items={analysis.strengths} icon={CheckCircle2} intro="Recursos que vale preservar nas próximas partidas." /><List title="Pontos a melhorar" items={analysis.weaknesses} icon={TrendingUp} intro="Temas construtivos para orientar o próximo estudo." /></section>;
}

function List({ title, items, icon: Icon, intro }: { title: string; items: string[]; icon: typeof CheckCircle2; intro: string }) { return <article className="rounded-2xl border border-line bg-surface p-5 shadow-sm"><h2 className="text-xl font-semibold">{title}</h2><p className="mt-1 text-sm text-muted">{intro}</p>{items.length ? <ul className="mt-4 space-y-3">{items.map((item) => <li key={item} className="flex gap-3 rounded-xl bg-neutral-100 p-3 text-sm font-medium"><Icon className="mt-0.5 shrink-0" size={18} aria-hidden="true" />{item}</li>)}</ul> : <p className="mt-4 text-sm text-muted">Não informado.</p>}</article>; }
