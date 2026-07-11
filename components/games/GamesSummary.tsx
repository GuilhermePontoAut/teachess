import { CircleEqual, Clock3, ExternalLink, Monitor, SearchCheck, Swords, Trophy, XCircle, type LucideIcon } from "lucide-react";
import type { ChessGame } from "@/lib/types/chess";

function SummaryItem({ label, value, icon: Icon }: { label: string; value: number; icon: LucideIcon }) {
  return <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm"><div className="flex items-center justify-between gap-3"><span className="text-sm font-medium text-muted">{label}</span><Icon size={17} className="text-neutral-500" aria-hidden="true" /></div><p className="mt-2 text-2xl font-bold text-neutral-950">{value}</p></div>;
}

export function GamesSummary({ games }: { games: ChessGame[] }) {
  const count = (predicate: (game: ChessGame) => boolean) => games.filter(predicate).length;
  return <section aria-label="Resumo das partidas" className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8"><SummaryItem label="Total" value={games.length} icon={Swords} /><SummaryItem label="Plataforma" value={count((game) => game.origin === "platform")} icon={Monitor} /><SummaryItem label="Externas" value={count((game) => game.origin === "external")} icon={ExternalLink} /><SummaryItem label="Vitórias" value={count((game) => game.result === "win")} icon={Trophy} /><SummaryItem label="Derrotas" value={count((game) => game.result === "loss")} icon={XCircle} /><SummaryItem label="Empates" value={count((game) => game.result === "draw")} icon={CircleEqual} /><SummaryItem label="Analisadas" value={count((game) => game.analysisStatus === "analyzed")} icon={SearchCheck} /><SummaryItem label="Pendentes" value={count((game) => game.analysisStatus !== "analyzed")} icon={Clock3} /></section>;
}
