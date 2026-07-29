import type { ChessColor, PositionEngineAnalysis, PrincipalVariation } from "./contracts";

export const STOCKFISH_VERSION = "18";
export const STOCKFISH_DISTRIBUTION = "stockfish.js 18.0.0 lite-single";
export const STOCKFISH_WORKER_PATH = "/stockfish/stockfish-18-lite-single.js";
export const STOCKFISH_DEPTH = 16;
export const STOCKFISH_HASH_MB = 16;
export const STOCKFISH_TIMEOUT_MS = 15_000;

export type UciSearchInfo = {
  depth: number;
  evaluation: number | null;
  mateIn: number | null;
  moves: string[];
};

export function parseUciInfo(line: string, sideToMove: ChessColor): UciSearchInfo | null {
  if (!line.startsWith("info ") || !line.includes(" pv ")) return null;
  const depthMatch = line.match(/\bdepth (\d+)/);
  const scoreMatch = line.match(/\bscore (cp|mate) (-?\d+)/);
  const pvMatch = line.match(/\bpv (.+)$/);
  if (!depthMatch || !scoreMatch || !pvMatch) return null;

  const sign = sideToMove === "white" ? 1 : -1;
  const rawScore = Number(scoreMatch[2]);
  return {
    depth: Number(depthMatch[1]),
    evaluation: scoreMatch[1] === "cp" ? (rawScore / 100) * sign : null,
    mateIn: scoreMatch[1] === "mate" ? rawScore * sign : null,
    moves: pvMatch[1].trim().split(/\s+/),
  };
}

export function createPositionAnalysis(
  fen: string,
  bestMove: string | null,
  info: UciSearchInfo,
): PositionEngineAnalysis {
  const fields = fen.trim().split(/\s+/);
  const sideToMove: ChessColor = fields[1] === "b" ? "black" : "white";
  const variation: PrincipalVariation = {
    rank: 1,
    evaluation: info.evaluation,
    mateIn: info.mateIn,
    moves: info.moves,
  };
  return {
    fen,
    moveNumber: Number(fields[5]),
    sideToMove,
    bestMove,
    evaluation: info.evaluation,
    mateIn: info.mateIn,
    principalVariations: [variation],
    engineSettings: {
      engine: "stockfish",
      engineVersion: STOCKFISH_VERSION,
      depth: STOCKFISH_DEPTH,
      multiPv: 1,
      threads: 1,
      hashMb: STOCKFISH_HASH_MB,
    },
  };
}
