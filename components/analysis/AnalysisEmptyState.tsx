import { BarChart3, ArrowLeft, Clock3 } from "lucide-react";
import Link from "next/link";
import type { AnalysisStatus } from "@/lib/types/chess";

export function AnalysisEmptyState({ status, gameId, onLoadDemo }: { status: Exclude<AnalysisStatus, "analyzed">; gameId: string; onLoadDemo: () => void }) {
  const pending = status === "pending";
  const Icon = pending ? Clock3 : BarChart3;
  return <section className="rounded-2xl border border-dashed border-line-strong bg-surface px-5 py-12 text-center"><Icon className="mx-auto text-neutral-500" size={38} aria-hidden="true" /><h2 className="mt-4 text-xl font-semibold">{pending ? "Análise de demonstração pendente" : "Análise ainda não disponível"}</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted">{pending ? "Nenhuma análise real está sendo processada. Você pode carregar um modelo estático apenas para conhecer a experiência futura." : "Esta partida não possui análise mockada associada. Uma demonstração estática e determinística pode ser exibida sem executar qualquer processamento inteligente."}</p><div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row"><button type="button" onClick={onLoadDemo} className="rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">{pending ? "Carregar análise de demonstração" : "Ver demonstração de análise"}</button><Link href={`/partidas/${gameId}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"><ArrowLeft size={17} aria-hidden="true" />Voltar aos detalhes</Link></div></section>;
}
