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
  authorizedPositionSnapshotSchema,
  type AuthorizedPositionSnapshot,
} from "./get-position-context.schemas";
import { executeGetPositionContext } from "./get-position-context";
import {
  GET_POSITION_CONTEXT_TOOL_NAME,
  positionContextOpenAITools,
} from "./get-position-context.openai";
import { PositionContextToolError } from "./tool-errors";

export const POSITION_CONTEXT_TOOL_FLOW_MODEL = "gpt-5-mini" as const;
export const POSITION_CONTEXT_TOOL_MESSAGE_MAX_LENGTH = 2_000;

export const positionContextToolRequestSchema = z
  .object({
    message: z
      .string()
      .trim()
      .min(1)
      .max(POSITION_CONTEXT_TOOL_MESSAGE_MAX_LENGTH),
    authorizedSnapshot: authorizedPositionSnapshotSchema,
  })
  .strict();

export type PositionContextToolRequest = z.infer<
  typeof positionContextToolRequestSchema
>;

type FirstProviderResponse = Pick<
  Response,
  "status" | "output" | "incomplete_details"
>;

type FinalProviderResponse = Pick<
  ParsedResponse<unknown>,
  "status" | "output" | "output_parsed" | "incomplete_details"
>;

export type PositionContextToolTransport = {
  createResponse: (
    params: ResponseCreateParamsNonStreaming,
  ) => Promise<FirstProviderResponse>;
  parseResponse: (
    params: ResponseCreateParamsNonStreaming,
  ) => Promise<FinalProviderResponse>;
};

export type PositionContextToolFlowErrorCode =
  | "TOOL_CALL_MISSING"
  | "MULTIPLE_TOOL_CALLS_UNEXPECTED"
  | "TOOL_NAME_NOT_SUPPORTED"
  | "TOOL_CALL_ID_INVALID"
  | "TOOL_ARGUMENTS_JSON_INVALID"
  | "TOOL_ARGUMENTS_INVALID"
  | "SNAPSHOT_MISSING"
  | "SNAPSHOT_INVALID"
  | "POSITION_CONTEXT_NOT_AUTHORIZED"
  | "TOOL_EXECUTION_FAILED"
  | "FIRST_RESPONSE_INCOMPLETE"
  | "FIRST_RESPONSE_REFUSED"
  | "FINAL_RESPONSE_INCOMPLETE"
  | "FINAL_RESPONSE_REFUSED"
  | "FINAL_STRUCTURED_OUTPUT_UNAVAILABLE"
  | "PROVIDER_ERROR";

const flowErrorMessages: Record<PositionContextToolFlowErrorCode, string> = {
  TOOL_CALL_MISSING: "O provedor não solicitou a Tool esperada.",
  MULTIPLE_TOOL_CALLS_UNEXPECTED:
    "O provedor solicitou mais chamadas de Tool que o fluxo permite.",
  TOOL_NAME_NOT_SUPPORTED: "O provedor solicitou uma Tool não suportada.",
  TOOL_CALL_ID_INVALID: "O provedor retornou um identificador de chamada inválido.",
  TOOL_ARGUMENTS_JSON_INVALID: "O provedor retornou argumentos de Tool inválidos.",
  TOOL_ARGUMENTS_INVALID: "Os argumentos de get_position_context são inválidos.",
  SNAPSHOT_MISSING: "O snapshot autorizado da posição não foi fornecido.",
  SNAPSHOT_INVALID: "O snapshot autorizado da posição é inválido.",
  POSITION_CONTEXT_NOT_AUTHORIZED:
    "O contexto de posição solicitado não está autorizado.",
  TOOL_EXECUTION_FAILED: "Não foi possível executar get_position_context.",
  FIRST_RESPONSE_INCOMPLETE: "O provedor não concluiu a solicitação da Tool.",
  FIRST_RESPONSE_REFUSED: "O provedor recusou a solicitação da Tool.",
  FINAL_RESPONSE_INCOMPLETE: "O provedor não concluiu a resposta final.",
  FINAL_RESPONSE_REFUSED: "O provedor recusou a resposta final.",
  FINAL_STRUCTURED_OUTPUT_UNAVAILABLE:
    "Não foi possível obter uma resposta estruturada confiável do provedor.",
  PROVIDER_ERROR: "Não foi possível obter uma resposta do provedor.",
};

export class PositionContextToolFlowError extends Error {
  readonly code: PositionContextToolFlowErrorCode;

  constructor(code: PositionContextToolFlowErrorCode, options?: ErrorOptions) {
    super(flowErrorMessages[code], options);
    this.name = "PositionContextToolFlowError";
    this.code = code;
  }

  toJSON() {
    return { code: this.code, message: this.message };
  }
}

export type PositionContextToolFlowInput = {
  message: string;
  authorizedSnapshot: AuthorizedPositionSnapshot;
  promptVersion: string;
  systemPrompt: string;
};

export type PositionContextToolFlowResult = {
  model: typeof POSITION_CONTEXT_TOOL_FLOW_MODEL;
  promptVersion: string;
  schemaVersion: typeof PROVISIONAL_TEACHER_RESPONSE_SCHEMA_VERSION;
  tool: {
    name: typeof GET_POSITION_CONTEXT_TOOL_NAME;
    callCount: 1;
    executionStatus: "completed";
  };
  data: ProvisionalTeacherResponse;
};

function hasRefusal(output: ResponseOutputItem[]): boolean {
  return output.some(
    (item) =>
      item.type === "message" &&
      item.content.some((content) => content.type === "refusal"),
  );
}

function parseFunctionCall(output: ResponseOutputItem[]) {
  const calls = output.filter((item) => item.type === "function_call");

  if (calls.length === 0) {
    throw new PositionContextToolFlowError("TOOL_CALL_MISSING");
  }
  if (calls.length > 1) {
    throw new PositionContextToolFlowError("MULTIPLE_TOOL_CALLS_UNEXPECTED");
  }

  const call = calls[0];

  if (call.name !== GET_POSITION_CONTEXT_TOOL_NAME) {
    throw new PositionContextToolFlowError("TOOL_NAME_NOT_SUPPORTED");
  }
  if (typeof call.call_id !== "string" || call.call_id.trim().length === 0) {
    throw new PositionContextToolFlowError("TOOL_CALL_ID_INVALID");
  }
  if (typeof call.arguments !== "string") {
    throw new PositionContextToolFlowError("TOOL_ARGUMENTS_JSON_INVALID");
  }

  let rawArguments: unknown;

  try {
    rawArguments = JSON.parse(call.arguments) as unknown;
  } catch {
    throw new PositionContextToolFlowError("TOOL_ARGUMENTS_JSON_INVALID");
  }

  return { callId: call.call_id, rawArguments };
}

function mapToolError(
  error: PositionContextToolError,
): PositionContextToolFlowError {
  if (
    error.code === "TOOL_ARGUMENTS_INVALID" ||
    error.code === "SNAPSHOT_MISSING" ||
    error.code === "SNAPSHOT_INVALID" ||
    error.code === "POSITION_CONTEXT_NOT_AUTHORIZED"
  ) {
    return new PositionContextToolFlowError(error.code);
  }

  return new PositionContextToolFlowError("TOOL_EXECUTION_FAILED");
}

function buildOriginalInput(
  message: string,
  positionContextId: string,
): ResponseInputItem[] {
  return [
    { role: "user", content: message },
    {
      role: "developer",
      content:
        `Contexto técnico confiável do servidor: a única posição autorizada nesta ` +
        `requisição usa positionContextId ${JSON.stringify(positionContextId)}. ` +
        `Chame ${GET_POSITION_CONTEXT_TOOL_NAME} exatamente com esse identificador.`,
    },
  ];
}

export async function runPositionContextToolFlow(
  input: PositionContextToolFlowInput,
  transport: PositionContextToolTransport,
): Promise<PositionContextToolFlowResult> {
  const snapshotValidation = authorizedPositionSnapshotSchema.safeParse(
    input.authorizedSnapshot,
  );
  if (!snapshotValidation.success) {
    throw new PositionContextToolFlowError(
      input.authorizedSnapshot === undefined
        ? "SNAPSHOT_MISSING"
        : "SNAPSHOT_INVALID",
    );
  }

  const originalInput = buildOriginalInput(
    input.message,
    snapshotValidation.data.positionContextId,
  );

  let firstResponse: FirstProviderResponse;

  try {
    firstResponse = await transport.createResponse({
      model: POSITION_CONTEXT_TOOL_FLOW_MODEL,
      instructions: input.systemPrompt,
      input: originalInput,
      tools: [...positionContextOpenAITools],
      tool_choice: {
        type: "function",
        name: GET_POSITION_CONTEXT_TOOL_NAME,
      },
      parallel_tool_calls: false,
      store: false,
    });
  } catch (error: unknown) {
    throw new PositionContextToolFlowError("PROVIDER_ERROR", { cause: error });
  }

  if (hasRefusal(firstResponse.output)) {
    throw new PositionContextToolFlowError("FIRST_RESPONSE_REFUSED");
  }
  if (firstResponse.status !== "completed") {
    throw new PositionContextToolFlowError("FIRST_RESPONSE_INCOMPLETE");
  }

  const { callId, rawArguments } = parseFunctionCall(firstResponse.output);
  let toolResult;

  try {
    toolResult = executeGetPositionContext({
      rawArguments,
      authorizedSnapshot: snapshotValidation.data,
    });
  } catch (error: unknown) {
    if (error instanceof PositionContextToolError) {
      throw mapToolError(error);
    }
    throw new PositionContextToolFlowError("TOOL_EXECUTION_FAILED");
  }

  const functionCallOutput: ResponseInputItem.FunctionCallOutput = {
    type: "function_call_output",
    call_id: callId,
    output: JSON.stringify({ success: true, data: toolResult }),
  };
  // A Responses API exige reenviar todos os itens anteriores. No SDK 6.47.0,
  // ResponseOutputItem e ResponseInputItem têm uma divergência de união em tools
  // embutidas, embora os itens retornados sejam aceitos como entrada pelo protocolo.
  const finalInput = [
    ...originalInput,
    ...firstResponse.output,
    functionCallOutput,
  ] as unknown as ResponseInput;

  let finalResponse: FinalProviderResponse;

  try {
    finalResponse = await transport.parseResponse({
      model: POSITION_CONTEXT_TOOL_FLOW_MODEL,
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
    throw new PositionContextToolFlowError("PROVIDER_ERROR", { cause: error });
  }

  if (hasRefusal(finalResponse.output)) {
    throw new PositionContextToolFlowError("FINAL_RESPONSE_REFUSED");
  }
  if (finalResponse.status !== "completed") {
    throw new PositionContextToolFlowError("FINAL_RESPONSE_INCOMPLETE");
  }

  const parsedOutput = provisionalTeacherResponseSchema.safeParse(
    finalResponse.output_parsed,
  );
  if (!parsedOutput.success) {
    throw new PositionContextToolFlowError(
      "FINAL_STRUCTURED_OUTPUT_UNAVAILABLE",
    );
  }

  return {
    model: POSITION_CONTEXT_TOOL_FLOW_MODEL,
    promptVersion: input.promptVersion,
    schemaVersion: PROVISIONAL_TEACHER_RESPONSE_SCHEMA_VERSION,
    tool: {
      name: GET_POSITION_CONTEXT_TOOL_NAME,
      callCount: 1,
      executionStatus: "completed",
    },
    data: parsedOutput.data,
  };
}
