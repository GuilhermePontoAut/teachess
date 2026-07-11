import { Chessboard } from "react-chessboard";
import type { PlayerColor } from "@/lib/types/chess";
import type { ReplayMove } from "@/lib/utils/analysis";
import { MoveNavigator } from "./MoveNavigator";

export function AnalysisBoard({ positions, moves, currentPly, playerColor, navigable, error, onNavigate }: { positions: string[]; moves: ReplayMove[]; currentPly: number; playerColor: PlayerColor; navigable: boolean; error: string | null; onNavigate: (ply: number) => void }) {
  const lastMove = currentPly > 0 ? moves[currentPly - 1] : undefined;
  const squareStyles = lastMove ? { [lastMove.from]: { background: "rgba(82,82,82,.36)" }, [lastMove.to]: { background: "rgba(23,23,23,.48)" } } : {};
  return <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5" aria-labelledby="analysis-board-title">
    <div className="mb-4"><h2 id="analysis-board-title" className="text-lg font-semibold">Tabuleiro da partida</h2><p className="mt-1 text-sm text-muted">Posição após {currentPly === 0 ? "o início" : `${currentPly} meio-lance${currentPly === 1 ? "" : "s"}`}.</p></div>
    <div className="mx-auto w-full max-w-[640px] overflow-hidden rounded-lg"><Chessboard options={{ id: "analysis-board", position: positions[currentPly] ?? positions[0], boardOrientation: playerColor, allowDragging: false, allowDrawingArrows: false, showNotation: true, squareStyles, darkSquareStyle: { backgroundColor: "#525252" }, lightSquareStyle: { backgroundColor: "#f5f5f5" } }} /></div>
    {navigable ? <MoveNavigator currentPly={currentPly} totalPlies={moves.length} onNavigate={onNavigate} /> : <p role={error ? "alert" : "status"} className="mt-4 rounded-xl bg-neutral-100 p-3 text-sm leading-6 text-neutral-700">{error ?? "Não há notação suficiente para navegar pela partida. A posição disponível foi mantida no tabuleiro."}</p>}
  </section>;
}
