import { currentUser } from "@/lib/data/users";
import type { ChessGame } from "@/lib/types/chess";
import { colorLabels } from "@/lib/utils/chess";
import { AnalysisStatusBadge } from "./AnalysisStatusBadge";
import { GameActions } from "./GameActions";
import { formatGameDate } from "./GameTable";
import { OriginBadge } from "./OriginBadge";
import { RatingComparison } from "./RatingComparison";
import { ResultBadge } from "./ResultBadge";

export function GameCard({ game, onDelete }: { game: ChessGame; onDelete: (game: ChessGame) => void }) {
  return <article className="rounded-2xl border border-line bg-surface p-4 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-medium text-muted">{formatGameDate(game.date)}</p><h2 className="mt-1 font-semibold text-neutral-950">{game.opponent} <span className="font-normal text-muted">({game.opponentRatingAtGame ?? "Não informado"})</span></h2><p className="mt-1 text-sm text-neutral-700">{game.title}</p></div><div className="flex gap-2"><OriginBadge origin={game.origin} /><ResultBadge result={game.result} /></div></div><div className="mt-3"><RatingComparison compact label={currentUser.name} ratingAtGame={game.playerRatingAtGame} currentRating={currentUser.currentPlatformRating} /></div><dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-line py-4 text-sm"><div><dt className="text-xs text-muted">Cor</dt><dd className="mt-1 font-medium">{colorLabels[game.playerColor]}</dd></div><div><dt className="text-xs text-muted">Lances</dt><dd className="mt-1 font-medium">{game.moveCount ?? "Não informado"}</dd></div><div className="col-span-2"><dt className="text-xs text-muted">Abertura</dt><dd className="mt-1 font-medium">{game.opening || "Não informado"}</dd></div><div><dt className="text-xs text-muted">Precisão</dt><dd className="mt-1 font-medium">{game.accuracy === null ? "—" : `${game.accuracy.toFixed(1)}%`}</dd></div><div><dt className="text-xs text-muted">Análise</dt><dd className="mt-1"><AnalysisStatusBadge status={game.analysisStatus} /></dd></div></dl><div className="mt-3 flex justify-end"><GameActions game={game} onDelete={onDelete} /></div></article>;
}
