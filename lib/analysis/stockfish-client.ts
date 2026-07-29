import type { ChessColor, PositionEngineAnalysis } from "./contracts";
import {
  createPositionAnalysis,
  parseUciInfo,
  STOCKFISH_DEPTH,
  STOCKFISH_TIMEOUT_MS,
  STOCKFISH_WORKER_PATH,
  type UciSearchInfo,
} from "./stockfish-protocol";

export class StockfishCancelledError extends Error {
  constructor() {
    super("Análise cancelada.");
    this.name = "StockfishCancelledError";
  }
}

export class StockfishTimeoutError extends Error {
  constructor() {
    super("O Stockfish excedeu o limite de 15 segundos.");
    this.name = "StockfishTimeoutError";
  }
}

export type StockfishAnalysisHandle = {
  result: Promise<PositionEngineAnalysis>;
  cancel: () => void;
};

export function analyzeFenWithStockfish(
  fen: string,
  timeoutMs = STOCKFISH_TIMEOUT_MS,
): StockfishAnalysisHandle {
  const worker = new Worker(STOCKFISH_WORKER_PATH);
  const sideToMove: ChessColor = fen.trim().split(/\s+/)[1] === "b" ? "black" : "white";
  let lastInfo: UciSearchInfo | null = null;
  let settled = false;
  let rejectResult: (reason: Error) => void = () => undefined;
  let timeoutId: ReturnType<typeof setTimeout>;

  const stopAndTerminate = () => {
    worker.postMessage("stop");
    worker.terminate();
  };

  const result = new Promise<PositionEngineAnalysis>((resolve, reject) => {
    rejectResult = reject;
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      stopAndTerminate();
      reject(error);
    };

    timeoutId = setTimeout(
      () => fail(new StockfishTimeoutError()),
      timeoutMs,
    );

    worker.onerror = () => fail(new Error("Não foi possível iniciar o Stockfish local."));
    worker.onmessage = (event: MessageEvent<unknown>) => {
      const line = String(event.data);
      if (line === "uciok") {
        worker.postMessage("setoption name Hash value 16");
        worker.postMessage("setoption name MultiPV value 1");
        worker.postMessage("isready");
        return;
      }
      if (line === "readyok") {
        worker.postMessage("ucinewgame");
        worker.postMessage(`position fen ${fen}`);
        worker.postMessage(`go depth ${STOCKFISH_DEPTH}`);
        return;
      }
      const info = parseUciInfo(line, sideToMove);
      if (info) lastInfo = info;
      if (!line.startsWith("bestmove ")) return;
      if (!lastInfo) {
        fail(new Error("O Stockfish encerrou sem produzir uma avaliação."));
        return;
      }
      const bestMoveToken = line.split(/\s+/)[1];
      const bestMove = bestMoveToken === "(none)" ? null : bestMoveToken;
      settled = true;
      clearTimeout(timeoutId);
      worker.terminate();
      resolve(createPositionAnalysis(fen, bestMove, lastInfo));
    };
    worker.postMessage("uci");
  });

  return {
    result,
    cancel: () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      stopAndTerminate();
      rejectResult(new StockfishCancelledError());
    },
  };
}
