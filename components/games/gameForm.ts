import { Chess, validateFen } from "chess.js";
import type { AnalysisStatus, ChessGame, ExternalGame, ExternalGameSource, GameResult, PlayerColor } from "@/lib/types/chess";

export interface GameFormValues {
  title: string;
  event: string;
  date: string;
  opponent: string;
  playerRatingAtGame: string;
  opponentRatingAtGame: string;
  externalSource: ExternalGameSource | "";
  externalSourceDetails: string;
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
  title: "", event: "", date: "", opponent: "", playerRatingAtGame: "", opponentRatingAtGame: "", externalSource: "", externalSourceDetails: "",
  playerColor: "", result: "", opening: "", moveCount: "", accuracy: "",
  analysisStatus: "not_analyzed", pgn: "", fen: "", onlineLink: "", notes: "", tags: [],
};

export function gameToFormValues(game: ChessGame): GameFormValues {
  return {
    title: game.title, event: game.event, date: game.date, opponent: game.opponent,
    playerRatingAtGame: game.playerRatingAtGame === undefined ? "" : String(game.playerRatingAtGame), opponentRatingAtGame: game.opponentRatingAtGame === undefined ? "" : String(game.opponentRatingAtGame), externalSource: game.externalSource ?? "", externalSourceDetails: game.externalSourceDetails ?? "",
    playerColor: game.playerColor, result: game.result, opening: game.opening ?? "",
    moveCount: game.moveCount === undefined ? "" : String(game.moveCount), accuracy: game.accuracy === null ? "" : String(game.accuracy),
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
    ["result", "Selecione o resultado."],
    ["externalSource", "Selecione a origem externa."],
  ];
  required.forEach(([field, message]) => { if (typeof values[field] === "string" && !values[field].trim()) errors[field] = message; });
  if (values.date && !isValidDate(values.date)) errors.date = "Informe uma data válida.";

  const validateRating = (field: "playerRatingAtGame" | "opponentRatingAtGame", label: string) => {
    const number = Number(values[field]);
    if (values[field].trim() && (!Number.isFinite(number) || number < 100 || number > 3500)) errors[field] = `${label} deve ser um número entre 100 e 3500.`;
  };
  validateRating("playerRatingAtGame", "O rating do jogador");
  validateRating("opponentRatingAtGame", "O rating do adversário");
  if (values.externalSource === "outro" && !values.externalSourceDetails.trim()) errors.externalSourceDetails = "Descreva a origem externa.";

  const moveCount = Number(values.moveCount);
  if (values.moveCount.trim() && (!Number.isInteger(moveCount) || moveCount <= 0)) errors.moveCount = "Informe um número inteiro de lances maior que zero.";
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

export function formValuesToGameData(values: GameFormValues): Omit<ExternalGame, "id" | "createdAt" | "updatedAt" | "status"> {
  return {
    title: values.title.trim(), event: values.event.trim(), date: values.date,
    opponent: values.opponent.trim(), playerRatingAtGame: values.playerRatingAtGame.trim() ? Number(values.playerRatingAtGame) : undefined,
    opponentRatingAtGame: values.opponentRatingAtGame.trim() ? Number(values.opponentRatingAtGame) : undefined, playerColor: values.playerColor as PlayerColor,
    origin: "external", visibility: "private", ownerUserId: "user-current", playerUserId: "user-current",
    opponentUserId: undefined, addedManually: true, externalSource: values.externalSource as ExternalGameSource,
    externalSourceDetails: values.externalSource === "outro" ? values.externalSourceDetails.trim() : undefined,
    result: values.result as GameResult, opening: values.opening.trim() || undefined, moveCount: values.moveCount.trim() ? Number(values.moveCount) : undefined,
    accuracy: values.accuracy.trim() ? Number(values.accuracy) : null, analysisStatus: values.analysisStatus,
    pgn: values.pgn.trim(), fen: values.fen.trim(), onlineLink: values.onlineLink.trim() || null,
    notes: values.notes.trim(), tags: values.tags.map((tag) => tag.trim()),
  };
}
