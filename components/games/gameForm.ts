import { Chess, validateFen } from "chess.js";
import type { AnalysisStatus, ChessGame, GameResult, PlayerColor } from "@/lib/types/chess";

export interface GameFormValues {
  title: string;
  event: string;
  date: string;
  opponent: string;
  playerRating: string;
  opponentRating: string;
  playerColor: PlayerColor | "";
  result: GameResult | "";
  opening: string;
  moveCount: string;
  accuracy: string;
  analysisStatus: AnalysisStatus;
  pgn: string;
  fen: string;
  onlineLink: string;
  notes: string;
  tags: string[];
}

export type GameFormErrors = Partial<Record<keyof GameFormValues, string>>;

export const emptyGameFormValues: GameFormValues = {
  title: "", event: "", date: "", opponent: "", playerRating: "", opponentRating: "",
  playerColor: "", result: "", opening: "", moveCount: "", accuracy: "",
  analysisStatus: "not_analyzed", pgn: "", fen: "", onlineLink: "", notes: "", tags: [],
};

export function gameToFormValues(game: ChessGame): GameFormValues {
  return {
    title: game.title, event: game.event, date: game.date, opponent: game.opponent,
    playerRating: String(game.playerRating), opponentRating: String(game.opponentRating),
    playerColor: game.playerColor, result: game.result, opening: game.opening,
    moveCount: String(game.moveCount), accuracy: game.accuracy === null ? "" : String(game.accuracy),
    analysisStatus: game.analysisStatus, pgn: game.pgn, fen: game.fen,
    onlineLink: game.onlineLink ?? "", notes: game.notes, tags: [...game.tags],
  };
}

const isValidDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

export function validateGameForm(values: GameFormValues): GameFormErrors {
  const errors: GameFormErrors = {};
  const required: Array<[keyof GameFormValues, string]> = [
    ["title", "Informe um título para a partida."], ["date", "Informe a data da partida."],
    ["opponent", "Informe o adversário."], ["playerColor", "Selecione a cor jogada."],
    ["result", "Selecione o resultado."], ["opening", "Informe a abertura."],
  ];
  required.forEach(([field, message]) => { if (typeof values[field] === "string" && !values[field].trim()) errors[field] = message; });
  if (values.date && !isValidDate(values.date)) errors.date = "Informe uma data válida.";

  const validateRating = (field: "playerRating" | "opponentRating", label: string) => {
    const number = Number(values[field]);
    if (!values[field].trim() || !Number.isFinite(number) || number < 100 || number > 3500) errors[field] = `${label} deve ser um número entre 100 e 3500.`;
  };
  validateRating("playerRating", "O rating do jogador");
  validateRating("opponentRating", "O rating do adversário");

  const moveCount = Number(values.moveCount);
  if (!values.moveCount.trim() || !Number.isInteger(moveCount) || moveCount <= 0) errors.moveCount = "Informe um número inteiro de lances maior que zero.";
  if (values.accuracy.trim()) {
    const accuracy = Number(values.accuracy);
    if (!Number.isFinite(accuracy) || accuracy < 0 || accuracy > 100) errors.accuracy = "A precisão deve estar entre 0 e 100.";
  }
  if (values.onlineLink.trim()) {
    try { new URL(values.onlineLink); } catch { errors.onlineLink = "Informe uma URL válida, incluindo http:// ou https://."; }
  }
  if (values.fen.trim() && !validateFen(values.fen.trim()).ok) errors.fen = "A posição FEN informada não é válida.";
  if (values.pgn.trim()) {
    try { new Chess().loadPgn(values.pgn.trim()); } catch { errors.pgn = "O formato do PGN não pôde ser validado."; }
  }
  const normalizedTags = values.tags.map((tag) => tag.trim().toLocaleLowerCase("pt-BR"));
  if (normalizedTags.some((tag) => !tag)) errors.tags = "Remova tags vazias.";
  else if (new Set(normalizedTags).size !== normalizedTags.length) errors.tags = "Remova tags duplicadas.";
  return errors;
}

export function formValuesToGameData(values: GameFormValues): Omit<ChessGame, "id" | "createdAt" | "updatedAt" | "status"> {
  return {
    title: values.title.trim(), event: values.event.trim(), date: values.date,
    opponent: values.opponent.trim(), playerRating: Number(values.playerRating),
    opponentRating: Number(values.opponentRating), playerColor: values.playerColor as PlayerColor,
    result: values.result as GameResult, opening: values.opening.trim(), moveCount: Number(values.moveCount),
    accuracy: values.accuracy.trim() ? Number(values.accuracy) : null, analysisStatus: values.analysisStatus,
    pgn: values.pgn.trim(), fen: values.fen.trim(), onlineLink: values.onlineLink.trim() || null,
    notes: values.notes.trim(), tags: values.tags.map((tag) => tag.trim()),
  };
}
