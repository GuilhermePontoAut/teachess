import { Chess } from "chess.js";
import {
  authorizedGameSnapshotSchema,
  getGameContextArgumentsSchema,
  getGameContextResultSchema,
  type AuthorizedGameSnapshot,
  type GetGameContextResult,
} from "./get-game-context.schemas";
import { GameContextToolError } from "./tool-errors";

export const GAME_CONTEXT_LIMITATIONS = {
  pgnAbsent: "PGN ausente.",
  pgnStructurallyInvalid: "PGN estruturalmente inválido.",
  pgnRejectedByChessJs: "PGN rejeitado pelo chess.js.",
  playerRatingAbsent: "Rating histórico do usuário ausente.",
  opponentRatingAbsent: "Rating histórico do adversário ausente.",
  openingAbsent: "Abertura ausente.",
  recordedMoveCountAbsent: "Quantidade cadastrada de lances ausente.",
  analysisPending: "Análise simulada ainda pendente.",
  analysisNotPerformed: "Análise simulada ainda não realizada.",
  simulatedData: "Dados da partida marcados como demonstração simulada.",
  externalPrivate: "Partida externa e privada; não integra ranking público.",
  moveSequenceUnavailable: "Sequência de lances indisponível para consulta.",
  acceptedPgnIsNotProof: "PGN aceito não comprova que a partida ocorreu.",
  noEngine: "A Tool não indica melhor lance nem executa engine de xadrez.",
} as const;

export type PgnLoader = (pgn: string) => number;

const defaultPgnLoader: PgnLoader = (pgn) => {
  const chess = new Chess();
  chess.loadPgn(pgn);
  return chess.history().length;
};

export function hasValidPgnStructure(pgn: string): boolean {
  if (/\0|\r(?!\n)/.test(pgn)) {
    return false;
  }

  const lines = pgn.split(/\r?\n/);
  let movetextStarted = false;
  const movetextLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (!movetextStarted && trimmed.startsWith("[")) {
      if (!/^\[[A-Za-z][A-Za-z0-9_]*\s+"(?:[^"\\]|\\.)*"\]$/.test(trimmed)) {
        return false;
      }
      continue;
    }

    movetextStarted = true;
    movetextLines.push(trimmed);
  }

  const movetext = movetextLines.join(" ");
  return (
    /(?:^|\s)1\.(?:\.\.)?\s*\S+/.test(movetext) &&
    /(?:1-0|0-1|1\/2-1\/2|\*)\s*$/.test(movetext)
  );
}

export function inspectGamePgn(
  pgn: string | null,
  loadPgn: PgnLoader = defaultPgnLoader,
): GetGameContextResult["pgn"] {
  if (pgn === null) {
    return {
      presence: "absent",
      value: null,
      structureStatus: "not_verified",
      chessJsValidationStatus: "not_verified",
      derivedPlyCount: null,
    };
  }

  if (!hasValidPgnStructure(pgn)) {
    return {
      presence: "present",
      value: pgn,
      structureStatus: "invalid",
      chessJsValidationStatus: "not_verified",
      derivedPlyCount: null,
    };
  }

  try {
    const derivedPlyCount = loadPgn(pgn);
    if (!Number.isInteger(derivedPlyCount) || derivedPlyCount < 1) {
      return {
        presence: "present",
        value: pgn,
        structureStatus: "valid",
        chessJsValidationStatus: "rejected",
        derivedPlyCount: null,
      };
    }

    return {
      presence: "present",
      value: pgn,
      structureStatus: "valid",
      chessJsValidationStatus: "accepted",
      derivedPlyCount,
    };
  } catch {
    return {
      presence: "present",
      value: pgn,
      structureStatus: "valid",
      chessJsValidationStatus: "rejected",
      derivedPlyCount: null,
    };
  }
}

function buildLimitations(
  result: Omit<GetGameContextResult, "limitations">,
): string[] {
  const limitations: string[] = [];

  if (result.pgn.presence === "absent") limitations.push(GAME_CONTEXT_LIMITATIONS.pgnAbsent);
  if (result.pgn.structureStatus === "invalid") {
    limitations.push(GAME_CONTEXT_LIMITATIONS.pgnStructurallyInvalid);
  }
  if (result.pgn.chessJsValidationStatus === "rejected") {
    limitations.push(GAME_CONTEXT_LIMITATIONS.pgnRejectedByChessJs);
  }
  if (result.metadata.playerRatingAtGame === null) {
    limitations.push(GAME_CONTEXT_LIMITATIONS.playerRatingAbsent);
  }
  if (result.metadata.opponentRatingAtGame === null) {
    limitations.push(GAME_CONTEXT_LIMITATIONS.opponentRatingAbsent);
  }
  if (result.metadata.opening === null) limitations.push(GAME_CONTEXT_LIMITATIONS.openingAbsent);
  if (result.metadata.recordedMoveCount === null) {
    limitations.push(GAME_CONTEXT_LIMITATIONS.recordedMoveCountAbsent);
  }
  if (result.metadata.analysisStatus === "pending") {
    limitations.push(GAME_CONTEXT_LIMITATIONS.analysisPending);
  }
  if (result.metadata.analysisStatus === "not_analyzed") {
    limitations.push(GAME_CONTEXT_LIMITATIONS.analysisNotPerformed);
  }
  if (result.dataNature === "simulated_demo") {
    limitations.push(GAME_CONTEXT_LIMITATIONS.simulatedData);
  }
  if (result.origin === "external") limitations.push(GAME_CONTEXT_LIMITATIONS.externalPrivate);
  if (result.pgn.chessJsValidationStatus !== "accepted") {
    limitations.push(GAME_CONTEXT_LIMITATIONS.moveSequenceUnavailable);
  } else {
    limitations.push(GAME_CONTEXT_LIMITATIONS.acceptedPgnIsNotProof);
  }
  limitations.push(GAME_CONTEXT_LIMITATIONS.noEngine);

  return limitations;
}

export function getGameContext(
  snapshot: AuthorizedGameSnapshot,
): GetGameContextResult {
  if (snapshot.ownerUserId !== snapshot.requestingUserId) {
    throw new GameContextToolError("GAME_CONTEXT_NOT_AUTHORIZED");
  }

  const pgn = inspectGamePgn(snapshot.pgn);
  const analysisReadiness =
    pgn.chessJsValidationStatus === "accepted"
      ? "sufficient_for_game_moves"
      : "sufficient_for_game_metadata";

  const resultWithoutLimitations: Omit<GetGameContextResult, "limitations"> = {
    gameContextId: snapshot.gameContextId,
    origin: snapshot.origin,
    visibility: snapshot.visibility,
    access: { status: "authorized", basis: "owner" },
    dataNature: snapshot.dataNature,
    metadata: {
      result: snapshot.result,
      playerColor: snapshot.playerColor,
      date: snapshot.date,
      opponent: snapshot.opponent,
      playerRatingAtGame: snapshot.playerRatingAtGame,
      opponentRatingAtGame: snapshot.opponentRatingAtGame,
      opening: snapshot.opening,
      recordedMoveCount: snapshot.recordedMoveCount,
      notes: snapshot.notes,
      tags: [...snapshot.tags],
      analysisStatus: snapshot.analysisStatus,
    },
    pgn,
    analysisReadiness,
  };

  return {
    ...resultWithoutLimitations,
    limitations: buildLimitations(resultWithoutLimitations),
  };
}

export type ExecuteGetGameContextInput = {
  rawArguments: unknown;
  authorizedSnapshot?: unknown;
};

function executeValidatedGetGameContext({
  rawArguments,
  authorizedSnapshot,
}: ExecuteGetGameContextInput): GetGameContextResult {
  if (authorizedSnapshot === null || authorizedSnapshot === undefined) {
    throw new GameContextToolError("SNAPSHOT_MISSING");
  }

  const parsedSnapshot = authorizedGameSnapshotSchema.safeParse(authorizedSnapshot);
  if (!parsedSnapshot.success) {
    throw new GameContextToolError("SNAPSHOT_INVALID");
  }

  const parsedArguments = getGameContextArgumentsSchema.safeParse(rawArguments);
  if (!parsedArguments.success) {
    throw new GameContextToolError("TOOL_ARGUMENTS_INVALID");
  }

  if (parsedArguments.data.gameContextId !== parsedSnapshot.data.gameContextId) {
    throw new GameContextToolError("GAME_CONTEXT_NOT_AUTHORIZED");
  }

  const result = getGameContext(parsedSnapshot.data);
  const parsedResult = getGameContextResultSchema.safeParse(result);
  if (!parsedResult.success) {
    throw new GameContextToolError("INTERNAL_TOOL_ERROR");
  }

  if (parsedResult.data.gameContextId !== parsedSnapshot.data.gameContextId) {
    throw new GameContextToolError("INTERNAL_TOOL_ERROR");
  }

  return parsedResult.data;
}

export function executeGetGameContext(
  input: ExecuteGetGameContextInput,
): GetGameContextResult {
  try {
    return executeValidatedGetGameContext(input);
  } catch (error: unknown) {
    if (error instanceof GameContextToolError) throw error;
    throw new GameContextToolError("INTERNAL_TOOL_ERROR");
  }
}
