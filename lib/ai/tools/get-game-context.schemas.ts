import { z } from "zod";
import type {
  AnalysisStatus,
  GameOrigin,
  GameResult,
  GameVisibility,
  PlayerColor,
} from "../../types/chess";

export const GAME_CONTEXT_ID_MAX_LENGTH = 128;
export const GAME_CONTEXT_ID_PATTERN = /^[A-Za-z0-9._:-]+$/;
export const GAME_CONTEXT_PGN_MAX_LENGTH = 20_000;
export const GAME_CONTEXT_NOTES_MAX_LENGTH = 4_000;
export const GAME_CONTEXT_TAG_MAX_LENGTH = 64;
export const GAME_CONTEXT_TAGS_MAX_ITEMS = 10;

const gameOrigins = ["platform", "external"] as const satisfies readonly GameOrigin[];
const gameVisibilities = ["public", "private"] as const satisfies readonly GameVisibility[];
const gameResults = ["win", "loss", "draw"] as const satisfies readonly GameResult[];
const playerColors = ["white", "black"] as const satisfies readonly PlayerColor[];
const analysisStatuses = [
  "analyzed",
  "pending",
  "not_analyzed",
] as const satisfies readonly AnalysisStatus[];
const boundedIdSchema = z.string().trim().min(1).max(GAME_CONTEXT_ID_MAX_LENGTH);
const gameContextIdSchema = boundedIdSchema.regex(GAME_CONTEXT_ID_PATTERN);
const nullableTrimmedString = (maximum: number) =>
  z.string().trim().min(1).max(maximum).nullable();
const nullableRatingSchema = z.number().int().min(100).max(3500).nullable();

const dateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    return (
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === month - 1 &&
      parsed.getUTCDate() === day
    );
  });

export const getGameContextArgumentsSchema = z
  .object({
    gameContextId: gameContextIdSchema,
  })
  .strict();

export type GetGameContextArguments = z.infer<
  typeof getGameContextArgumentsSchema
>;

export const authorizedGameSnapshotSchema = z
  .object({
    gameContextId: gameContextIdSchema,
    origin: z.enum(gameOrigins),
    visibility: z.enum(gameVisibilities),
    ownerUserId: boundedIdSchema,
    requestingUserId: boundedIdSchema,
    result: z.enum(gameResults),
    playerColor: z.enum(playerColors),
    date: dateSchema,
    opponent: z.string().trim().min(1).max(160),
    playerRatingAtGame: nullableRatingSchema,
    opponentRatingAtGame: nullableRatingSchema,
    opening: nullableTrimmedString(160),
    recordedMoveCount: z.number().int().min(1).max(1_000).nullable(),
    pgn: nullableTrimmedString(GAME_CONTEXT_PGN_MAX_LENGTH),
    notes: z.string().trim().max(GAME_CONTEXT_NOTES_MAX_LENGTH),
    tags: z
      .array(z.string().trim().min(1).max(GAME_CONTEXT_TAG_MAX_LENGTH))
      .max(GAME_CONTEXT_TAGS_MAX_ITEMS),
    analysisStatus: z.enum(analysisStatuses),
    dataNature: z.enum(["simulated_demo", "user_provided"]),
  })
  .strict()
  .superRefine((snapshot, context) => {
    const expectedVisibility = snapshot.origin === "external" ? "private" : "public";
    if (snapshot.visibility !== expectedVisibility) {
      context.addIssue({
        code: "custom",
        path: ["visibility"],
        message: "A visibilidade deve preservar a regra da origem da partida.",
      });
    }

    if (
      snapshot.origin === "platform" &&
      snapshot.playerRatingAtGame === null
    ) {
      context.addIssue({
        code: "custom",
        path: ["playerRatingAtGame"],
        message: "Partidas da plataforma exigem o rating histórico do usuário.",
      });
    }
    if (
      snapshot.origin === "platform" &&
      snapshot.opponentRatingAtGame === null
    ) {
      context.addIssue({
        code: "custom",
        path: ["opponentRatingAtGame"],
        message: "Partidas da plataforma exigem o rating histórico do adversário.",
      });
    }
    if (snapshot.origin === "platform" && snapshot.opening === null) {
      context.addIssue({
        code: "custom",
        path: ["opening"],
        message: "Partidas da plataforma exigem abertura.",
      });
    }
    if (
      snapshot.origin === "platform" &&
      snapshot.recordedMoveCount === null
    ) {
      context.addIssue({
        code: "custom",
        path: ["recordedMoveCount"],
        message: "Partidas da plataforma exigem a quantidade cadastrada de lances.",
      });
    }

    if (new Set(snapshot.tags).size !== snapshot.tags.length) {
      context.addIssue({
        code: "custom",
        path: ["tags"],
        message: "Tags não podem conter itens duplicados.",
      });
    }
  });

export type AuthorizedGameSnapshot = z.infer<
  typeof authorizedGameSnapshotSchema
>;

const limitationSchema = z.string().min(1).max(180);

export const getGameContextResultSchema = z
  .object({
    gameContextId: gameContextIdSchema,
    origin: z.enum(gameOrigins),
    visibility: z.enum(gameVisibilities),
    access: z
      .object({
        status: z.literal("authorized"),
        basis: z.literal("owner"),
      })
      .strict(),
    dataNature: z.enum(["simulated_demo", "user_provided"]),
    metadata: z
      .object({
        result: z.enum(gameResults),
        playerColor: z.enum(playerColors),
        date: dateSchema,
        opponent: z.string().trim().min(1).max(160),
        playerRatingAtGame: nullableRatingSchema,
        opponentRatingAtGame: nullableRatingSchema,
        opening: nullableTrimmedString(160),
        recordedMoveCount: z.number().int().min(1).max(1_000).nullable(),
        notes: z.string().trim().max(GAME_CONTEXT_NOTES_MAX_LENGTH),
        tags: z
          .array(z.string().trim().min(1).max(GAME_CONTEXT_TAG_MAX_LENGTH))
          .max(GAME_CONTEXT_TAGS_MAX_ITEMS),
        analysisStatus: z.enum(analysisStatuses),
      })
      .strict(),
    pgn: z
      .object({
        presence: z.enum(["present", "absent"]),
        value: nullableTrimmedString(GAME_CONTEXT_PGN_MAX_LENGTH),
        structureStatus: z.enum(["valid", "invalid", "not_verified"]),
        chessJsValidationStatus: z.enum([
          "accepted",
          "rejected",
          "not_verified",
        ]),
        derivedPlyCount: z.number().int().min(1).max(2_000).nullable(),
      })
      .strict(),
    analysisReadiness: z.enum([
      "sufficient_for_game_moves",
      "sufficient_for_game_metadata",
    ]),
    limitations: z.array(limitationSchema).max(16),
  })
  .strict()
  .superRefine((result, context) => {
    const addIssue = (path: PropertyKey[], message: string) => {
      context.addIssue({ code: "custom", path, message });
    };

    if (result.origin === "external" && result.visibility !== "private") {
      addIssue(
        ["visibility"],
        "Partidas externas devem permanecer privadas no resultado.",
      );
    }
    if (result.origin === "platform" && result.visibility !== "public") {
      addIssue(
        ["visibility"],
        "Partidas da plataforma devem preservar visibilidade pública.",
      );
    }

    if (
      result.origin === "platform" &&
      result.metadata.playerRatingAtGame === null
    ) {
      addIssue(
        ["metadata", "playerRatingAtGame"],
        "Partidas da plataforma exigem o rating histórico do usuário.",
      );
    }
    if (
      result.origin === "platform" &&
      result.metadata.opponentRatingAtGame === null
    ) {
      addIssue(
        ["metadata", "opponentRatingAtGame"],
        "Partidas da plataforma exigem o rating histórico do adversário.",
      );
    }
    if (result.origin === "platform" && result.metadata.opening === null) {
      addIssue(
        ["metadata", "opening"],
        "Partidas da plataforma exigem abertura.",
      );
    }
    if (
      result.origin === "platform" &&
      result.metadata.recordedMoveCount === null
    ) {
      addIssue(
        ["metadata", "recordedMoveCount"],
        "Partidas da plataforma exigem a quantidade cadastrada de lances.",
      );
    }

    const pgnAbsent =
      result.pgn.presence === "absent" &&
      result.pgn.value === null &&
      result.pgn.structureStatus === "not_verified" &&
      result.pgn.chessJsValidationStatus === "not_verified" &&
      result.pgn.derivedPlyCount === null;
    const pgnStructurallyInvalid =
      result.pgn.presence === "present" &&
      result.pgn.value !== null &&
      result.pgn.structureStatus === "invalid" &&
      result.pgn.chessJsValidationStatus === "not_verified" &&
      result.pgn.derivedPlyCount === null;
    const pgnAccepted =
      result.pgn.presence === "present" &&
      result.pgn.value !== null &&
      result.pgn.structureStatus === "valid" &&
      result.pgn.chessJsValidationStatus === "accepted" &&
      result.pgn.derivedPlyCount !== null;
    const pgnRejected =
      result.pgn.presence === "present" &&
      result.pgn.value !== null &&
      result.pgn.structureStatus === "valid" &&
      result.pgn.chessJsValidationStatus === "rejected" &&
      result.pgn.derivedPlyCount === null;

    if (!(pgnAbsent || pgnStructurallyInvalid || pgnAccepted || pgnRejected)) {
      addIssue(
        ["pgn"],
        "PGN deve corresponder a um dos quatro estados semânticos permitidos.",
      );
    }

    const expectedReadiness =
      result.pgn.chessJsValidationStatus === "accepted"
        ? "sufficient_for_game_moves"
        : "sufficient_for_game_metadata";

    if (result.analysisReadiness !== expectedReadiness) {
      addIssue(
        ["analysisReadiness"],
        "Readiness deve refletir a aceitação do PGN.",
      );
    }

    if (new Set(result.metadata.tags).size !== result.metadata.tags.length) {
      addIssue(["metadata", "tags"], "Tags não podem conter itens duplicados.");
    }
    if (new Set(result.limitations).size !== result.limitations.length) {
      addIssue(["limitations"], "Limitações não podem conter itens duplicados.");
    }
  });

export type GetGameContextResult = z.infer<
  typeof getGameContextResultSchema
>;
