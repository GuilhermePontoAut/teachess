import { CircleEqual, Clock3, SearchCheck, Swords, Trophy, XCircle, type LucideIcon } from "lucide-react";
import type { ChessGame } from "@/lib/types/chess";

function SummaryItem({ label, value, icon: Icon }: { label: string; value: number; icon: LucideIcon }) {
  return <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm"><div className="flex items-center justify-between gap-3"><span className="text-sm font-medium text-muted">{label}</span><Icon size={17} className="text-neutral-500" aria-hidden="true" /></div><p className="mt-2 text-2xl font-bold text-neutral-950">{value}</p></div>;
}

export function GamesSummary({ games }: { games: ChessGame[] }) {
  const summary = {
    wins: games.filter((game) => game.result === "win").length,
    losses: games.filter((game) => game.result === "loss").length,
    draws: games.filter((game) => game.result === "draw").length,
    analyzed: games.filter((game) => game.analysisStatus === "analyzed").length,
    pending: games.filter((game) => game.analysisStatus === "pending").length,
  };
  return <section aria-label="Resumo das partidas" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6"><SummaryItem label="Total" value={games.length} icon={Swords} /><SummaryItem label="Vitórias" value={summary.wins} icon={Trophy} /><SummaryItem label="Derrotas" value={summary.losses} icon={XCircle} /><SummaryItem label="Empates" value={summary.draws} icon={CircleEqual} /><SummaryItem label="Analisadas" value={summary.analyzed} icon={SearchCheck} /><SummaryItem label="Pendentes" value={summary.pending} icon={Clock3} /></section>;
}
