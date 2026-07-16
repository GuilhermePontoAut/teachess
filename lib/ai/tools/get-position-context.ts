import { validateFen } from "chess.js";
import {
  authorizedPositionSnapshotSchema,
  getPositionContextArgumentsSchema,
  getPositionContextResultSchema,
  type AuthorizedPositionSnapshot,
  type GetPositionContextResult,
} from "./get-position-context.schemas";
import { PositionContextToolError } from "./tool-errors";

export const POSITION_CONTEXT_LIMITATIONS = {
  fenAbsent: "FEN ausente.",
  fenStructurallyInvalid: "FEN estruturalmente inválido.",
  fenRejectedByChessJs: "FEN rejeitado pelo chess.js.",
  confirmationNotRecorded: "Confirmação da posição não registrada.",
  positionUnconfirmed: "Posição explicitamente não confirmada.",
  recognitionNotProcessed: "Reconhecimento da posição não processado.",
  simulatedContext: "Contexto demonstrativo e simulado.",
  sideToMoveUnavailable: "Lado a mover indisponível.",
} as const;

export function hasValidFenStructure(fen: string): boolean {
  if (!/^[^\s]+(?: [^\s]+){5}$/.test(fen)) {
    return false;
  }

  const [placement, activeColor, castling, enPassant, halfmove, fullmove] =
    fen.split(" ");
  const ranks = placement.split("/");

  if (ranks.length !== 8) {
    return false;
  }

  for (const rank of ranks) {
    if (!/^[prnbqkPRNBQK1-8]+$/.test(rank)) {
      return false;
    }

    const squareCount = [...rank].reduce(
      (total, character) => total + (/[1-8]/.test(character) ? Number(character) : 1),
      0,
    );

    if (squareCount !== 8) {
      return false;
    }
  }

  return (
    /^[wb]$/.test(activeColor) &&
    /^(?:-|K?Q?k?q?)$/.test(castling) &&
    /^(?:-|[a-h][36])$/.test(enPassant) &&
    /^(?:0|[1-9]\d*)$/.test(halfmove) &&
    /^[1-9]\d*$/.test(fullmove)
  );
}

function buildLimitations(result: Omit<GetPositionContextResult, "limitations">): string[] {
  const limitations: string[] = [];

  if (result.fen.presence === "absent") {
    limitations.push(POSITION_CONTEXT_LIMITATIONS.fenAbsent);
  }
  if (result.fen.syntaxStatus === "invalid") {
    limitations.push(POSITION_CONTEXT_LIMITATIONS.fenStructurallyInvalid);
  }
  if (result.fen.chessJsValidationStatus === "rejected") {
    limitations.push(POSITION_CONTEXT_LIMITATIONS.fenRejectedByChessJs);
  }
  if (result.confirmationStatus === "not_recorded") {
    limitations.push(POSITION_CONTEXT_LIMITATIONS.confirmationNotRecorded);
  }
  if (result.confirmationStatus === "unconfirmed") {
    limitations.push(POSITION_CONTEXT_LIMITATIONS.positionUnconfirmed);
  }
  if (result.recognition.status === "not_processed") {
    limitations.push(POSITION_CONTEXT_LIMITATIONS.recognitionNotProcessed);
  }
  if (result.recognition.dataNature === "simulated_demo") {
    limitations.push(POSITION_CONTEXT_LIMITATIONS.simulatedContext);
  }
  if (result.sideToMove === "unknown") {
    limitations.push(POSITION_CONTEXT_LIMITATIONS.sideToMoveUnavailable);
  }

  return limitations;
}

export function getPositionContext(
  snapshot: AuthorizedPositionSnapshot,
): GetPositionContextResult {
  const fenPresence = snapshot.fen === null ? "absent" : "present";
  const syntaxStatus =
    snapshot.fen === null
      ? "not_verified"
      : hasValidFenStructure(snapshot.fen)
        ? "valid"
        : "invalid";
  const chessJsValidationStatus =
    snapshot.fen === null || syntaxStatus === "invalid"
      ? "not_verified"
      : validateFen(snapshot.fen).ok
        ? "accepted"
        : "rejected";
  const sideToMove =
    snapshot.fen !== null &&
    syntaxStatus === "valid" &&
    chessJsValidationStatus === "accepted"
      ? snapshot.fen.split(" ")[1] === "w"
        ? "white"
        : "black"
      : "unknown";
  const analysisReadiness =
    fenPresence === "present" &&
    syntaxStatus === "valid" &&
    chessJsValidationStatus === "accepted" &&
    snapshot.confirmationStatus === "confirmed"
      ? "sufficient_for_position_context"
      : "insufficient";

  const resultWithoutLimitations: Omit<GetPositionContextResult, "limitations"> = {
    positionContextId: snapshot.positionContextId,
    recognition: {
      status: snapshot.recognitionStatus,
      dataNature: snapshot.dataNature,
    },
    fen: {
      presence: fenPresence,
      value: snapshot.fen,
      syntaxStatus,
      chessJsValidationStatus,
    },
    origin: {
      status: "known",
      imageOrigin: snapshot.imageOrigin,
      sourceContext: snapshot.sourceContext,
    },
    confirmationStatus: snapshot.confirmationStatus,
    sideToMove,
    analysisReadiness,
  };

  return {
    ...resultWithoutLimitations,
    limitations: buildLimitations(resultWithoutLimitations),
  };
}

export type ExecuteGetPositionContextInput = {
  rawArguments: unknown;
  authorizedSnapshot?: unknown;
};

function executeValidatedGetPositionContext({
  rawArguments,
  authorizedSnapshot,
}: ExecuteGetPositionContextInput): GetPositionContextResult {
  if (authorizedSnapshot === null || authorizedSnapshot === undefined) {
    throw new PositionContextToolError("SNAPSHOT_MISSING");
  }

  const parsedSnapshot = authorizedPositionSnapshotSchema.safeParse(authorizedSnapshot);
  if (!parsedSnapshot.success) {
    throw new PositionContextToolError("SNAPSHOT_INVALID");
  }

  const parsedArguments = getPositionContextArgumentsSchema.safeParse(rawArguments);
  if (!parsedArguments.success) {
    throw new PositionContextToolError("TOOL_ARGUMENTS_INVALID");
  }

  if (parsedArguments.data.positionContextId !== parsedSnapshot.data.positionContextId) {
    throw new PositionContextToolError("POSITION_CONTEXT_NOT_AUTHORIZED");
  }

  const result = getPositionContext(parsedSnapshot.data);
  const parsedResult = getPositionContextResultSchema.safeParse(result);

  if (!parsedResult.success) {
    throw new PositionContextToolError("INTERNAL_TOOL_ERROR");
  }

  return parsedResult.data;
}

export function executeGetPositionContext(
  input: ExecuteGetPositionContextInput,
): GetPositionContextResult {
  try {
    return executeValidatedGetPositionContext(input);
  } catch (error: unknown) {
    if (error instanceof PositionContextToolError) {
      throw error;
    }

    throw new PositionContextToolError("INTERNAL_TOOL_ERROR");
  }
}
