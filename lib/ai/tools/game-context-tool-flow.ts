import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import type {
  ParsedResponse,
  Response,
  ResponseCreateParamsNonStreaming,
  ResponseInput,
  ResponseInputItem,
  ResponseOutputItem,
} from "openai/resources/responses/responses";
import {
  PROVISIONAL_TEACHER_RESPONSE_SCHEMA_VERSION,
  provisionalTeacherResponseSchema,
  type ProvisionalTeacherResponse,
} from "../schemas/provisional-teacher-response";
import {
  authorizedGameSnapshotSchema,
  type AuthorizedGameSnapshot,
  type GetGameContextResult,
} from "./get-game-context.schemas";
import {
  executeGetGameContext,
  type ExecuteGetGameContextInput,
} from "./get-game-context";
import {
  gameContextOpenAITools,
  GET_GAME_CONTEXT_TOOL_NAME,
} from "./get-game-context.openai";
import { GameContextToolError } from "./tool-errors";

export const GAME_CONTEXT_TOOL_FLOW_MODEL = "gpt-5-mini" as const;
export const GAME_CONTEXT_TOOL_MESSAGE_MAX_LENGTH = 2_000;
export const GAME_CONTEXT_TOOL_CALL_ID_MAX_LENGTH = 256;

export const gameContextToolRequestSchema = z
  .object({
    message: z
      .string()
      .trim()
      .min(1)
      .max(GAME_CONTEXT_TOOL_MESSAGE_MAX_LENGTH),
    authorizedSnapshot: authorizedGameSnapshotSchema,
  })
  .strict();

export type GameContextToolRequest = z.infer<typeof gameContextToolRequestSchema>;

type FirstProviderResponse = Pick<
  Response,
  "status" | "output" | "incomplete_details"
>;

type FinalProviderResponse = Pick<
  ParsedResponse<unknown>,
  "status" | "output" | "output_parsed" | "incomplete_details"
>;

export type GameContextToolTransport = {
  createResponse: (
    params: ResponseCreateParamsNonStreaming,
  ) => Promise<FirstProviderResponse>;
  parseResponse: (
    params: ResponseCreateParamsNonStreaming,
  ) => Promise<FinalProviderResponse>;
};

export type ExecuteGameContextTool = (
  input: ExecuteGetGameContextInput,
) => GetGameContextResult;

export type GameContextToolFlowDependencies = GameContextToolTransport & {
  executeGetGameContext?: ExecuteGameContextTool;
};

export type GameContextToolFlowErrorCode =
  | "TOOL_CALL_MISSING"
  | "MULTIPLE_TOOL_CALLS_UNEXPECTED"
  | "TOOL_NAME_NOT_SUPPORTED"
  | "TOOL_CALL_ID_INVALID"
  | "TOOL_ARGUMENTS_JSON_INVALID"
  | "TOOL_ARGUMENTS_INVALID"
  | "SNAPSHOT_MISSING"
  | "SNAPSHOT_INVALID"
  | "GAME_CONTEXT_NOT_AUTHORIZED"
  | "TOOL_EXECUTION_FAILED"
  | "FIRST_RESPONSE_INCOMPLETE"
  | "FIRST_RESPONSE_REFUSED"
  | "FINAL_RESPONSE_INCOMPLETE"
  | "FINAL_RESPONSE_REFUSED"
  | "FINAL_STRUCTURED_OUTPUT_UNAVAILABLE"
  | "PROVIDER_ERROR"
  | "INTERNAL_ERROR";

const flowErrorMessages: Record<GameContextToolFlowErrorCode, string> = {
  TOOL_CALL_MISSING: "O provedor não solicitou a Tool esperada.",
  MULTIPLE_TOOL_CALLS_UNEXPECTED:
    "O provedor solicitou mais chamadas de Tool que o fluxo permite.",
  TOOL_NAME_NOT_SUPPORTED: "O provedor solicitou uma Tool não suportada.",
  TOOL_CALL_ID_INVALID: "O provedor retornou um identificador de chamada inválido.",
  TOOL_ARGUMENTS_JSON_INVALID: "O provedor retornou argumentos de Tool inválidos.",
  TOOL_ARGUMENTS_INVALID: "Os argumentos de get_game_context são inválidos.",
  SNAPSHOT_MISSING: "O snapshot autorizado da partida não foi fornecido.",
  SNAPSHOT_INVALID: "O snapshot autorizado da partida é inválido.",
  GAME_CONTEXT_NOT_AUTHORIZED:
    "O contexto de partida solicitado não está autorizado.",
  TOOL_EXECUTION_FAILED: "Não foi possível executar get_game_context.",
  FIRST_RESPONSE_INCOMPLETE: "O provedor não concluiu a solicitação da Tool.",
  FIRST_RESPONSE_REFUSED: "O provedor recusou a solicitação da Tool.",
  FINAL_RESPONSE_INCOMPLETE: "O provedor não concluiu a resposta final.",
  FINAL_RESPONSE_REFUSED: "O provedor recusou a resposta final.",
  FINAL_STRUCTURED_OUTPUT_UNAVAILABLE:
    "Não foi possível obter uma resposta estruturada confiável do provedor.",
  PROVIDER_ERROR: "Não foi possível obter uma resposta do provedor.",
  INTERNAL_ERROR: "Não foi possível concluir o fluxo de contexto da partida.",
};

export class GameContextToolFlowError extends Error {
  readonly code: GameContextToolFlowErrorCode;

  constructor(code: GameContextToolFlowErrorCode, options?: ErrorOptions) {
    super(flowErrorMessages[code], options);
    this.name = "GameContextToolFlowError";
    this.code = code;
  }

  toJSON() {
    return { code: this.code, message: this.message };
  }
}

export type GameContextToolFlowInput = {
  message: string;
  authorizedSnapshot?: unknown;
  model: typeof GAME_CONTEXT_TOOL_FLOW_MODEL;
  promptVersion: string;
  systemPrompt: string;
};

export type GameContextToolFlowResult = {
  model: typeof GAME_CONTEXT_TOOL_FLOW_MODEL;
  promptVersion: string;
  schemaVersion: typeof PROVISIONAL_TEACHER_RESPONSE_SCHEMA_VERSION;
  tool: {
    name: typeof GET_GAME_CONTEXT_TOOL_NAME;
    callCount: 1;
    executionStatus: "completed";
  };
  data: ProvisionalTeacherResponse;
};

function hasRefusal(output: unknown): boolean {
  if (!Array.isArray(output)) return false;
  return output.some((item: unknown) => {
    if (
      typeof item !== "object" ||
      item === null ||
      !("type" in item) ||
      item.type !== "message" ||
      !("content" in item) ||
      !Array.isArray(item.content)
    ) {
      return false;
    }
    return item.content.some(
      (content: unknown) =>
        typeof content === "object" &&
        content !== null &&
        "type" in content &&
        content.type === "refusal",
    );
  });
}

function validateSnapshot(snapshot: unknown): AuthorizedGameSnapshot {
  if (snapshot === null || snapshot === undefined) {
    throw new GameContextToolFlowError("SNAPSHOT_MISSING");
  }

  const parsed = authorizedGameSnapshotSchema.safeParse(snapshot);
  if (!parsed.success) {
    throw new GameContextToolFlowError("SNAPSHOT_INVALID");
  }
  if (parsed.data.ownerUserId !== parsed.data.requestingUserId) {
    throw new GameContextToolFlowError("GAME_CONTEXT_NOT_AUTHORIZED");
  }
  return parsed.data;
}

function parseFunctionCall(output: unknown) {
  if (!Array.isArray(output)) {
    throw new GameContextToolFlowError("TOOL_CALL_MISSING");
  }
  const calls = output.filter(
    (item: unknown): item is Extract<ResponseOutputItem, { type: "function_call" }> =>
      typeof item === "object" &&
      item !== null &&
      "type" in item &&
      item.type === "function_call",
  );

  if (calls.length === 0) throw new GameContextToolFlowError("TOOL_CALL_MISSING");
  if (calls.length > 1) {
    throw new GameContextToolFlowError("MULTIPLE_TOOL_CALLS_UNEXPECTED");
  }

  const call = calls[0];
  if (call.name !== GET_GAME_CONTEXT_TOOL_NAME) {
    throw new GameContextToolFlowError("TOOL_NAME_NOT_SUPPORTED");
  }
  if (
    typeof call.call_id !== "string" ||
    call.call_id.trim().length === 0 ||
    call.call_id.length > GAME_CONTEXT_TOOL_CALL_ID_MAX_LENGTH
  ) {
    throw new GameContextToolFlowError("TOOL_CALL_ID_INVALID");
  }
  if (typeof call.arguments !== "string") {
    throw new GameContextToolFlowError("TOOL_ARGUMENTS_JSON_INVALID");
  }

  let rawArguments: unknown;
  try {
    rawArguments = JSON.parse(call.arguments) as unknown;
  } catch {
    throw new GameContextToolFlowError("TOOL_ARGUMENTS_JSON_INVALID");
  }

  return { callId: call.call_id, rawArguments };
}

function mapToolError(error: GameContextToolError): GameContextToolFlowError {
  switch (error.code) {
    case "TOOL_ARGUMENTS_INVALID":
    case "SNAPSHOT_MISSING":
    case "SNAPSHOT_INVALID":
    case "GAME_CONTEXT_NOT_AUTHORIZED":
      return new GameContextToolFlowError(error.code);
    case "INTERNAL_TOOL_ERROR":
      return new GameContextToolFlowError("TOOL_EXECUTION_FAILED");
  }
}

function buildOriginalInput(
  message: string,
  gameContextId: string,
): ResponseInputItem[] {
  return [
    { role: "user", content: message },
    {
      role: "developer",
      content:
        `Contexto técnico confiável do servidor: a única partida autorizada nesta ` +
        `requisição usa gameContextId ${JSON.stringify(gameContextId)}. ` +
        `Chame ${GET_GAME_CONTEXT_TOOL_NAME} exatamente com esse identificador.`,
    },
  ];
}

async function runValidatedGameContextToolFlow(
  input: GameContextToolFlowInput,
  dependencies: GameContextToolFlowDependencies,
): Promise<GameContextToolFlowResult> {
  const snapshot = validateSnapshot(input.authorizedSnapshot);
  const originalInput = buildOriginalInput(input.message, snapshot.gameContextId);

  let firstResponse: FirstProviderResponse;
  try {
    firstResponse = await dependencies.createResponse({
      model: input.model,
      instructions: input.systemPrompt,
      input: originalInput,
      tools: [...gameContextOpenAITools],
      tool_choice: { type: "function", name: GET_GAME_CONTEXT_TOOL_NAME },
      parallel_tool_calls: false,
      store: false,
    });
  } catch (error: unknown) {
    throw new GameContextToolFlowError("PROVIDER_ERROR", { cause: error });
  }

  if (hasRefusal(firstResponse.output)) {
    throw new GameContextToolFlowError("FIRST_RESPONSE_REFUSED");
  }
  if (firstResponse.status !== "completed") {
    throw new GameContextToolFlowError("FIRST_RESPONSE_INCOMPLETE");
  }

  const { callId, rawArguments } = parseFunctionCall(firstResponse.output);
  let toolResult: GetGameContextResult;
  try {
    toolResult = (dependencies.executeGetGameContext ?? executeGetGameContext)({
      rawArguments,
      authorizedSnapshot: snapshot,
    });
  } catch (error: unknown) {
    if (error instanceof GameContextToolError) throw mapToolError(error);
    throw new GameContextToolFlowError("TOOL_EXECUTION_FAILED");
  }

  const functionCallOutput: ResponseInputItem.FunctionCallOutput = {
    type: "function_call_output",
    call_id: callId,
    output: JSON.stringify({ success: true, data: toolResult }),
  };
  // O SDK 6.47.0 não torna toda a união ResponseOutputItem atribuível à união
  // ResponseInputItem para algumas Tools embutidas. O protocolo exige preservar
  // todos os itens; por isso a adaptação fica localizada após a concatenação integral.
  const finalInput = [
    ...originalInput,
    ...firstResponse.output,
    functionCallOutput,
  ] as unknown as ResponseInput;

  let finalResponse: FinalProviderResponse;
  try {
    finalResponse = await dependencies.parseResponse({
      model: input.model,
      instructions: input.systemPrompt,
      input: finalInput,
      text: {
        format: zodTextFormat(
          provisionalTeacherResponseSchema,
          "provisional_teacher_response",
        ),
      },
      store: false,
    });
  } catch (error: unknown) {
    throw new GameContextToolFlowError("PROVIDER_ERROR", { cause: error });
  }

  if (hasRefusal(finalResponse.output)) {
    throw new GameContextToolFlowError("FINAL_RESPONSE_REFUSED");
  }
  if (finalResponse.status !== "completed") {
    throw new GameContextToolFlowError("FINAL_RESPONSE_INCOMPLETE");
  }

  const parsedOutput = provisionalTeacherResponseSchema.safeParse(
    finalResponse.output_parsed,
  );
  if (!parsedOutput.success) {
    throw new GameContextToolFlowError("FINAL_STRUCTURED_OUTPUT_UNAVAILABLE");
  }

  return {
    model: input.model,
    promptVersion: input.promptVersion,
    schemaVersion: PROVISIONAL_TEACHER_RESPONSE_SCHEMA_VERSION,
    tool: {
      name: GET_GAME_CONTEXT_TOOL_NAME,
      callCount: 1,
      executionStatus: "completed",
    },
    data: parsedOutput.data,
  };
}

export async function runGameContextToolFlow(
  input: GameContextToolFlowInput,
  dependencies: GameContextToolFlowDependencies,
): Promise<GameContextToolFlowResult> {
  try {
    return await runValidatedGameContextToolFlow(input, dependencies);
  } catch (error: unknown) {
    if (error instanceof GameContextToolFlowError) throw error;
    throw new GameContextToolFlowError("INTERNAL_ERROR");
  }
}
