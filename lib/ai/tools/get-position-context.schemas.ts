import { z } from "zod";
import type {
  ImageOrigin,
  PositionSourceContext,
  RecognitionStatus,
} from "../../types/chess";

export const POSITION_CONTEXT_ID_MAX_LENGTH = 128;
export const POSITION_CONTEXT_ID_PATTERN = /^[A-Za-z0-9._:-]+$/;
export const POSITION_CONTEXT_FEN_MAX_LENGTH = 256;

const imageOrigins = [
  "physical_board_photo",
  "online_game_screenshot",
] as const satisfies readonly ImageOrigin[];

const positionSourceContexts = [
  "in_person_game",
  "tournament",
  "club",
  "personal_study",
  "teachess",
  "chess.com",
  "lichess",
  "other",
] as const satisfies readonly PositionSourceContext[];

const recognitionStatuses = [
  "demo_available",
  "preview_only",
  "not_processed",
] as const satisfies readonly RecognitionStatus[];

const positionContextIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(POSITION_CONTEXT_ID_MAX_LENGTH)
  .regex(POSITION_CONTEXT_ID_PATTERN);

const fenValueSchema = z
  .string()
  .trim()
  .min(1)
  .max(POSITION_CONTEXT_FEN_MAX_LENGTH);

export const getPositionContextArgumentsSchema = z
  .object({
    positionContextId: positionContextIdSchema,
  })
  .strict();

export type GetPositionContextArguments = z.infer<
  typeof getPositionContextArgumentsSchema
>;

export const authorizedPositionSnapshotSchema = z
  .object({
    positionContextId: positionContextIdSchema,
    fen: fenValueSchema.nullable(),
    imageOrigin: z.enum(imageOrigins),
    sourceContext: z.enum(positionSourceContexts),
    recognitionStatus: z.enum(recognitionStatuses),
    dataNature: z.literal("simulated_demo"),
    confirmationStatus: z.enum(["confirmed", "unconfirmed", "not_recorded"]),
  })
  .strict();

export type AuthorizedPositionSnapshot = z.infer<
  typeof authorizedPositionSnapshotSchema
>;

const limitationSchema = z.string().min(1).max(160);

export const getPositionContextResultSchema = z
  .object({
    positionContextId: positionContextIdSchema,
    recognition: z
      .object({
        status: z.enum(recognitionStatuses),
        dataNature: z.enum(["simulated_demo", "unknown"]),
      })
      .strict(),
    fen: z
      .object({
        presence: z.enum(["present", "absent"]),
        value: fenValueSchema.nullable(),
        syntaxStatus: z.enum(["valid", "invalid", "not_verified"]),
        chessJsValidationStatus: z.enum([
          "accepted",
          "rejected",
          "not_verified",
        ]),
      })
      .strict(),
    origin: z
      .object({
        status: z.enum(["known", "unknown"]),
        imageOrigin: z.enum(imageOrigins).nullable(),
        sourceContext: z.enum(positionSourceContexts).nullable(),
      })
      .strict(),
    confirmationStatus: z.enum(["confirmed", "unconfirmed", "not_recorded"]),
    sideToMove: z.enum(["white", "black", "unknown"]),
    analysisReadiness: z.enum([
      "sufficient_for_position_context",
      "insufficient",
    ]),
    limitations: z.array(limitationSchema).max(8),
  })
  .strict()
  .superRefine((result, context) => {
    const addIssue = (path: PropertyKey[], message: string) => {
      context.addIssue({
        code: "custom",
        path,
        message,
      });
    };

    if (result.fen.presence === "absent") {
      if (result.fen.value !== null) {
        addIssue(["fen", "value"], "FEN ausente deve ter valor nulo.");
      }
      if (result.fen.syntaxStatus !== "not_verified") {
        addIssue(
          ["fen", "syntaxStatus"],
          "FEN ausente não pode ter sintaxe verificada.",
        );
      }
      if (result.fen.chessJsValidationStatus !== "not_verified") {
        addIssue(
          ["fen", "chessJsValidationStatus"],
          "FEN ausente não pode ter validação pelo chess.js.",
        );
      }
      if (result.sideToMove !== "unknown") {
        addIssue(["sideToMove"], "FEN ausente não pode definir o lado a mover.");
      }
      if (result.analysisReadiness !== "insufficient") {
        addIssue(
          ["analysisReadiness"],
          "FEN ausente exige contexto insuficiente para análise.",
        );
      }
    } else if (result.fen.value === null) {
      addIssue(["fen", "value"], "FEN presente deve ter valor não nulo.");
    }

    if (result.fen.syntaxStatus !== "valid") {
      if (result.fen.chessJsValidationStatus !== "not_verified") {
        addIssue(
          ["fen", "chessJsValidationStatus"],
          "Sintaxe não válida exige validação pelo chess.js não verificada.",
        );
      }
      if (result.sideToMove !== "unknown") {
        addIssue(
          ["sideToMove"],
          "Sintaxe não válida não pode definir o lado a mover.",
        );
      }
      if (result.analysisReadiness !== "insufficient") {
        addIssue(
          ["analysisReadiness"],
          "Sintaxe não válida exige contexto insuficiente para análise.",
        );
      }
    }

    if (result.fen.chessJsValidationStatus === "accepted") {
      if (result.fen.presence !== "present") {
        addIssue(
          ["fen", "presence"],
          "Validação aceita pelo chess.js exige FEN presente.",
        );
      }
      if (result.fen.syntaxStatus !== "valid") {
        addIssue(
          ["fen", "syntaxStatus"],
          "Validação aceita pelo chess.js exige sintaxe válida.",
        );
      }
    }

    if (result.fen.chessJsValidationStatus === "rejected") {
      if (result.fen.presence !== "present") {
        addIssue(
          ["fen", "presence"],
          "Validação rejeitada pelo chess.js exige FEN presente.",
        );
      }
      if (result.fen.syntaxStatus !== "valid") {
        addIssue(
          ["fen", "syntaxStatus"],
          "Validação rejeitada pelo chess.js exige sintaxe válida.",
        );
      }
      if (result.sideToMove !== "unknown") {
        addIssue(
          ["sideToMove"],
          "FEN rejeitado pelo chess.js não pode definir o lado a mover.",
        );
      }
      if (result.analysisReadiness !== "insufficient") {
        addIssue(
          ["analysisReadiness"],
          "FEN rejeitado pelo chess.js exige contexto insuficiente para análise.",
        );
      }
    }

    if (result.sideToMove !== "unknown") {
      const canDeriveSideToMove =
        result.fen.presence === "present" &&
        result.fen.syntaxStatus === "valid" &&
        result.fen.chessJsValidationStatus === "accepted";

      if (!canDeriveSideToMove) {
        addIssue(
          ["sideToMove"],
          "Lado a mover conhecido exige FEN presente, válido e aceito pelo chess.js.",
        );
      }
    }

    const hasSufficientPositionContext =
      result.fen.presence === "present" &&
      result.fen.value !== null &&
      result.fen.syntaxStatus === "valid" &&
      result.fen.chessJsValidationStatus === "accepted" &&
      result.confirmationStatus === "confirmed";
    const expectedAnalysisReadiness = hasSufficientPositionContext
      ? "sufficient_for_position_context"
      : "insufficient";

    if (result.analysisReadiness !== expectedAnalysisReadiness) {
      addIssue(
        ["analysisReadiness"],
        "Readiness deve refletir FEN presente, válido, aceito e confirmado.",
      );
    }

    if (result.origin.status === "known") {
      if (result.origin.imageOrigin === null) {
        addIssue(
          ["origin", "imageOrigin"],
          "Origem conhecida exige imageOrigin.",
        );
      }
      if (result.origin.sourceContext === null) {
        addIssue(
          ["origin", "sourceContext"],
          "Origem conhecida exige sourceContext.",
        );
      }
    } else {
      if (result.origin.imageOrigin !== null) {
        addIssue(
          ["origin", "imageOrigin"],
          "Origem desconhecida exige imageOrigin nulo.",
        );
      }
      if (result.origin.sourceContext !== null) {
        addIssue(
          ["origin", "sourceContext"],
          "Origem desconhecida exige sourceContext nulo.",
        );
      }
    }

    if (new Set(result.limitations).size !== result.limitations.length) {
      addIssue(["limitations"], "Limitações não podem conter itens duplicados.");
    }
  });

export type GetPositionContextResult = z.infer<
  typeof getPositionContextResultSchema
>;
