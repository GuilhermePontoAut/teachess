import { z } from "zod";
import {
  PROVISIONAL_TEACHER_RESPONSE_SCHEMA_VERSION,
  provisionalTeacherResponseSchema,
} from "../schemas/provisional-teacher-response";
import { GAME_CONTEXT_TOOL_FLOW_MODEL } from "./game-context-tool-flow";
import { authorizedGameSnapshotSchema } from "./get-game-context.schemas";
import { GET_GAME_CONTEXT_TOOL_NAME } from "./get-game-context.openai";
import { authorizedPositionSnapshotSchema } from "./get-position-context.schemas";
import { GET_POSITION_CONTEXT_TOOL_NAME } from "./get-position-context.openai";

export const PROFESSOR_CONTEXT_TOOL_MESSAGE_MAX_LENGTH = 2_000;

const authorizedGameContextSchema = z
  .object({
    type: z.literal("game"),
    snapshot: authorizedGameSnapshotSchema,
  })
  .strict();

const authorizedPositionContextSchema = z
  .object({
    type: z.literal("position"),
    snapshot: authorizedPositionSnapshotSchema,
  })
  .strict();

const noAuthorizedContextSchema = z
  .object({
    type: z.literal("none"),
  })
  .strict();

export const authorizedProfessorContextSchema = z.discriminatedUnion("type", [
  authorizedGameContextSchema,
  authorizedPositionContextSchema,
  noAuthorizedContextSchema,
]);

export type AuthorizedProfessorContext = z.infer<
  typeof authorizedProfessorContextSchema
>;

export const professorContextToolRequestSchema = z
  .object({
    message: z
      .string()
      .trim()
      .min(1)
      .max(PROFESSOR_CONTEXT_TOOL_MESSAGE_MAX_LENGTH),
    authorizedContext: authorizedProfessorContextSchema,
  })
  .strict();

export type ProfessorContextToolRequest = z.infer<
  typeof professorContextToolRequestSchema
>;

const calledDecisionSchema = z
  .object({
    status: z.literal("called"),
    name: z.enum([
      GET_GAME_CONTEXT_TOOL_NAME,
      GET_POSITION_CONTEXT_TOOL_NAME,
    ]),
    callCount: z.literal(1),
    executionStatus: z.literal("completed"),
  })
  .strict();

const notCalledDecisionSchema = z
  .object({
    status: z.literal("not_called"),
    name: z.null(),
    callCount: z.literal(0),
    executionStatus: z.literal("not_executed"),
  })
  .strict();

export const professorContextToolFlowResultSchema = z
  .object({
    data: provisionalTeacherResponseSchema,
    toolDecision: z.discriminatedUnion("status", [
      calledDecisionSchema,
      notCalledDecisionSchema,
    ]),
  })
  .strict();

export type ProfessorContextToolFlowResult = z.infer<
  typeof professorContextToolFlowResultSchema
>;

export const PROFESSOR_CONTEXT_TOOL_FLOW_MODEL =
  GAME_CONTEXT_TOOL_FLOW_MODEL;
export const PROFESSOR_CONTEXT_TOOL_FLOW_SCHEMA_VERSION =
  PROVISIONAL_TEACHER_RESPONSE_SCHEMA_VERSION;
