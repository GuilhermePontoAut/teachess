import { Chess, DEFAULT_POSITION, type Square } from "chess.js";
import type { ChessGame, ErrorCategory, GameAnalysis } from "@/lib/types/chess";

export interface ReplayMove {
  ply: number;
  moveNumber: number;
  color: "white" | "black";
  san: string;
  from: Square;
  to: Square;
  fen: string;
}

export interface GameReplay {
  positions: string[];
  moves: ReplayMove[];
  error: string | null;
  navigable: boolean;
}

export const errorCategoryLabels: Record<ErrorCategory, string> = {
  opening: "Abertura",
  tactics: "Tática",
  strategy: "Estratégia",
  time_management: "Gerenciamento de tempo",
  calculation: "Cálculo",
  endgame: "Final",
};

export function buildGameReplay(game: ChessGame): GameReplay {
  let fallback = DEFAULT_POSITION;
  if (game.fen.trim()) {
    try { fallback = new Chess(game.fen).fen(); } catch { fallback = DEFAULT_POSITION; }
  }
  if (!game.pgn.trim()) return { positions: [fallback], moves: [], error: null, navigable: false };

  try {
    const parsed = new Chess();
    parsed.loadPgn(game.pgn);
    const history = parsed.history({ verbose: true });
    const replay = new Chess();
    const positions = [replay.fen()];
    const moves: ReplayMove[] = history.map((move, index) => {
      replay.move(move.san);
      const ply = index + 1;
      const item: ReplayMove = {
        ply,
        moveNumber: Math.ceil(ply / 2),
        color: move.color === "w" ? "white" : "black",
        san: move.san,
        from: move.from,
        to: move.to,
        fen: replay.fen(),
      };
      positions.push(item.fen);
      return item;
    });
    return { positions, moves, error: null, navigable: moves.length > 0 };
  } catch {
    return {
      positions: [fallback],
      moves: [],
      error: "Não foi possível interpretar a notação desta partida. O conteúdo didático simulado continua disponível.",
      navigable: false,
    };
  }
}

export function getCriticalPly(moveNumber: number, san: string, moves: ReplayMove[]): number {
  return moves.find((move) => move.moveNumber === moveNumber && move.san === san)?.ply
    ?? moves.find((move) => move.moveNumber === moveNumber)?.ply
    ?? Math.min(moves.length, Math.max(0, moveNumber * 2 - 1));
}

export function createStaticDemoAnalysis(gameId: string): GameAnalysis {
  return {
    id: `demo-${gameId}`,
    gameId,
    summary: "A demonstração destaca a importância de desenvolver as peças, proteger o rei e revisar as respostas forçadas antes de escolher um plano.",
    strengths: ["Registro da partida disponível para revisão", "Disposição para identificar planos alternativos"],
    weaknesses: ["Organização do desenvolvimento", "Revisão de ameaças imediatas"],
    criticalMoments: [],
    errorCategories: ["opening", "calculation"],
    evaluationHistory: [],
    simulatedAccuracy: 72,
    recommendation: "Reproduza a partida lentamente e, em cada lance, liste xeques, capturas e ameaças.",
    createdAt: "2026-06-15T12:00:00.000Z",
  };
}
