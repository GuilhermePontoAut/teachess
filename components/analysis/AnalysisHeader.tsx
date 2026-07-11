import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ChessGame } from "@/lib/types/chess";
import { resultLabels } from "@/lib/utils/chess";
import { AnalysisStatusBadge } from "@/components/games/AnalysisStatusBadge";
import { OriginBadge } from "@/components/games/OriginBadge";
import { ResultBadge } from "@/components/games/ResultBadge";

const actionClass = "inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

export function AnalysisHeader({ game }: { game: ChessGame }) {
  const date = Number.isNaN(Date.parse(`${game.date}T12:00:00`)) ? "Não informado" : new Date(`${game.date}T12:00:00`).toLocaleDateString("pt-BR");
  return <header className="space-y-5">
    <div><p className="section-kicker">Revisão didática simulada</p><h1 className="text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">Análise da partida</h1><p className="mt-2 text-sm leading-6 text-neutral-600">Contra {game.opponent || "Não informado"}, em {date}. Resultado: {resultLabels[game.result]}.</p></div>
    <div className="flex flex-wrap gap-2"><ResultBadge result={game.result} /><OriginBadge origin={game.origin} /><AnalysisStatusBadge status={game.analysisStatus} /><span className="rounded-full border border-line bg-white px-2.5 py-1 text-xs font-semibold">{game.visibility === "private" ? "Privada" : "Pública"}</span></div>
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap"><Link href={`/partidas/${game.id}`} className={actionClass}><ArrowLeft size={17} aria-hidden="true" />Voltar aos detalhes</Link><Link href="/partidas" className={actionClass}><ArrowLeft size={17} aria-hidden="true" />Voltar para Minhas Partidas</Link></div>
  </header>;
}
