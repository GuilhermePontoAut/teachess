import type { AuthorizedProfessorContext } from "@/lib/ai/tools/professor-context-tool-flow.schemas";
import type { ChessGame, UploadedPosition } from "@/lib/types/chess";
import type {
  FutureAiContextRef,
  ProfessorAnswerContent,
  ProfessorToolDecision,
} from "@/lib/future-ai/demo";

export const PROFESSOR_REQUEST_TIMEOUT_MS = 60_000;

export type ProfessorApiSuccess = {
  success: true;
  data: ProfessorAnswerContent;
  toolDecision: ProfessorToolDecision;
};

export type ProfessorApiError = {
  success: false;
  error?: { code?: string; message?: string };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function isProfessorApiSuccess(
  value: unknown,
): value is ProfessorApiSuccess {
  if (!isRecord(value) || value.success !== true || !isRecord(value.data)) {
    return false;
  }
  const data = value.data;
  if (
    typeof data.summary !== "string" ||
    !isStringArray(data.observations) ||
    !isStringArray(data.strengths) ||
    !isStringArray(data.improvements) ||
    !isStringArray(data.studyRecommendations) ||
    !isStringArray(data.evidenceUsed) ||
    !isStringArray(data.limitations) ||
    !["sufficient", "partial", "insufficient"].includes(
      String(data.evidenceStatus),
    ) ||
    !isRecord(value.toolDecision)
  ) {
    return false;
  }

  const decision = value.toolDecision;
  return (
    (decision.status === "called" &&
      (decision.name === "get_game_context" ||
        decision.name === "get_position_context") &&
      decision.callCount === 1 &&
      decision.executionStatus === "completed") ||
    (decision.status === "not_called" &&
      decision.name === null &&
      decision.callCount === 0 &&
      decision.executionStatus === "not_executed")
  );
}

export function buildAuthorizedProfessorContext(
  context: FutureAiContextRef,
  selectedGame: ChessGame | undefined,
  selectedPosition: UploadedPosition | undefined,
  requestingUserId: string,
): AuthorizedProfessorContext | null {
  if (context.type === "game-analysis" && selectedGame) {
    return {
      type: "game",
      snapshot: {
        gameContextId: selectedGame.id,
        origin: selectedGame.origin,
        visibility: selectedGame.visibility,
        ownerUserId: selectedGame.ownerUserId,
        requestingUserId,
        result: selectedGame.result,
        playerColor: selectedGame.playerColor,
        date: selectedGame.date,
        opponent: selectedGame.opponent,
        playerRatingAtGame: selectedGame.playerRatingAtGame ?? null,
        opponentRatingAtGame: selectedGame.opponentRatingAtGame ?? null,
        opening: selectedGame.opening?.trim() || null,
        recordedMoveCount: selectedGame.moveCount ?? null,
        pgn: selectedGame.pgn.trim() || null,
        notes: selectedGame.notes,
        tags: selectedGame.tags,
        analysisStatus: selectedGame.analysisStatus,
        dataNature:
          selectedGame.origin === "external"
            ? "user_provided"
            : "simulated_demo",
      },
    };
  }

  if (context.type === "saved-position" && selectedPosition) {
    return {
      type: "position",
      snapshot: {
        positionContextId: selectedPosition.id,
        fen: selectedPosition.simulatedDetectedFen,
        imageOrigin: selectedPosition.imageOrigin,
        sourceContext: selectedPosition.sourceContext,
        recognitionStatus: selectedPosition.recognitionStatus,
        dataNature: "simulated_demo",
        confirmationStatus: "not_recorded",
      },
    };
  }

  return null;
}

function sanitizeText(value: string, contextId: string): string {
  return value
    .replaceAll(contextId, "contexto selecionado")
    .replaceAll("get_game_context", "partida selecionada")
    .replaceAll("get_position_context", "posição selecionada")
    .replaceAll("gameContextId", "partida selecionada")
    .replaceAll("positionContextId", "posição selecionada")
    .replaceAll("call_id", "referência interna");
}

export function sanitizeProfessorAnswerForDisplay(
  answer: ProfessorAnswerContent,
  contextId: string,
): ProfessorAnswerContent {
  const sanitizeItems = (items: string[]) =>
    items.map((item) => sanitizeText(item, contextId));

  return {
    summary: sanitizeText(answer.summary, contextId),
    observations: sanitizeItems(answer.observations),
    strengths: sanitizeItems(answer.strengths),
    improvements: sanitizeItems(answer.improvements),
    studyRecommendations: sanitizeItems(answer.studyRecommendations),
    evidenceUsed: sanitizeItems(answer.evidenceUsed),
    limitations: sanitizeItems(answer.limitations),
    evidenceStatus: answer.evidenceStatus,
  };
}
