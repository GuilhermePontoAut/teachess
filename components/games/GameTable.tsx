import type { ChessGame } from "@/lib/types/chess";
import { colorLabels } from "@/lib/utils/chess";
import { AnalysisStatusBadge } from "./AnalysisStatusBadge";
import { GameActions } from "./GameActions";
import { ResultBadge } from "./ResultBadge";

export const formatGameDate = (date: string) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${date}T12:00:00`));

export function GameTable({ games, onDelete }: { games: ChessGame[]; onDelete: (game: ChessGame) => void }) {
  return <div className="hidden overflow-hidden rounded-2xl border border-line bg-surface shadow-sm lg:block"><table className="w-full text-left text-sm"><thead className="bg-surface-subtle text-xs font-semibold text-muted"><tr><th className="px-4 py-3">Data</th><th className="px-4 py-3">Adversário</th><th className="px-3 py-3">Cor</th><th className="px-3 py-3">Resultado</th><th className="px-3 py-3">Abertura</th><th className="px-3 py-3 text-center">Lances</th><th className="px-3 py-3">Precisão</th><th className="px-3 py-3">Análise</th><th className="px-4 py-3">Ações</th></tr></thead><tbody className="divide-y divide-neutral-200">{games.map((game) => <tr key={game.id} className="align-top text-neutral-700 hover:bg-neutral-50"><td className="whitespace-nowrap px-4 py-4">{formatGameDate(game.date)}</td><td className="px-4 py-4"><p className="font-semibold text-neutral-950">{game.opponent}</p><p className="mt-0.5 text-xs text-muted">Rating {game.opponentRating}</p></td><td className="px-3 py-4">{colorLabels[game.playerColor]}</td><td className="px-3 py-4"><ResultBadge result={game.result} /></td><td className="max-w-48 px-3 py-4">{game.opening}</td><td className="px-3 py-4 text-center">{game.moveCount}</td><td className="whitespace-nowrap px-3 py-4 font-medium">{game.accuracy === null ? "—" : `${game.accuracy.toFixed(1)}%`}</td><td className="px-3 py-4"><AnalysisStatusBadge status={game.analysisStatus} /></td><td className="w-44 px-2 py-2"><GameActions game={game} onDelete={onDelete} /></td></tr>)}</tbody></table></div>;
}
