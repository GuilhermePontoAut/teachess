"use client";
import { useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import type { PlayerColor } from "@/lib/types/chess";

const startingFen = new Chess().fen();
export function PositionBoard({ id, simulatedFen, orientation, onFenChange }: { id: string; simulatedFen: string | null; orientation: PlayerColor; onFenChange: (fen: string) => void }) {
  const originalFen = simulatedFen ?? startingFen;
  const [game, setGame] = useState(() => new Chess(originalFen));
  const move = ({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }) => { if (!targetSquare) return false; try { const next = new Chess(game.fen()); next.move({ from: sourceSquare, to: targetSquare, promotion: "q" }); setGame(next); onFenChange(next.fen()); return true; } catch { return false; } };
  return <div className="overflow-hidden rounded-xl"><Chessboard options={{ id: `study-board-${id}`, position: game.fen(), boardOrientation: orientation, onPieceDrop: move, allowDrawingArrows: true, showNotation: true, darkSquareStyle: { backgroundColor: "#525252" }, lightSquareStyle: { backgroundColor: "#f5f5f5" } }}/></div>;
}
