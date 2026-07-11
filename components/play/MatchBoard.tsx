import { Chessboard } from "react-chessboard";
import type { PlayerColor } from "@/lib/types/chess";
import type { DemoMove } from "@/lib/types/play";

export function MatchBoard({ fen, orientation, lastMove, checkSquare, disabled, onDrop }: { fen: string; orientation: PlayerColor; lastMove?: DemoMove; checkSquare?: string; disabled: boolean; onDrop: (source: string, target: string | null) => boolean }) {
  const squareStyles: Record<string, React.CSSProperties> = {};
  if (lastMove) { squareStyles[lastMove.from] = { background: "rgba(82,82,82,.35)" }; squareStyles[lastMove.to] = { background: "rgba(23,23,23,.45)" }; }
  if (checkSquare) squareStyles[checkSquare] = { boxShadow: "inset 0 0 0 5px #b91c1c", background: "rgba(185,28,28,.22)" };
  return <div role="group" aria-label={`Tabuleiro de xadrez. Orientação: ${orientation === "white" ? "brancas" : "pretas"}. ${disabled ? "Movimentos bloqueados." : "Arraste uma peça para realizar um movimento legal."}`} className="mx-auto w-full max-w-[680px] overflow-hidden rounded-xl border border-neutral-300 bg-white shadow-sm"><Chessboard options={{ id: "demo-match-board", position: fen, boardOrientation: orientation, onPieceDrop: ({ sourceSquare, targetSquare }) => onDrop(sourceSquare, targetSquare), allowDragging: !disabled, allowDragOffBoard: false, allowDrawingArrows: false, showNotation: true, squareStyles, darkSquareStyle: { backgroundColor: "#525252" }, lightSquareStyle: { backgroundColor: "#f5f5f5" }, animationDurationInMs: 160 }}/></div>;
}
