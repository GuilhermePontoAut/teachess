import { zodTextFormat } from "openai/helpers/zod";
import type {
  ParsedResponse,
  Response,
  ResponseCreateParamsNonStreaming,
  ResponseFunctionToolCall,
  ResponseInput,
  ResponseInputItem,
  ResponseOutputMessage,
  ResponseOutputItem,
  ResponseReasoningItem,
} from "openai/resources/responses/responses";
import {
  provisionalTeacherResponseSchema,
  type ProvisionalTeacherResponse,
} from "../schemas/provisional-teacher-response";
import {
  getGameContextResultSchema,
  type GetGameContextResult,
} from "./get-game-context.schemas";
import {
  executeGetGameContext,
  type ExecuteGetGameContextInput,
} from "./get-game-context";
import {
  getGameContextOpenAITool,
  GET_GAME_CONTEXT_TOOL_NAME,
} from "./get-game-context.openai";
import {
  getPositionContextResultSchema,
  type GetPositionContextResult,
} from "./get-position-context.schemas";
import {
  executeGetPositionContext,
  type ExecuteGetPositionContextInput,
} from "./get-position-context";
import {
  getPositionContextOpenAITool,
  GET_POSITION_CONTEXT_TOOL_NAME,
} from "./get-position-context.openai";
import {
  authorizedProfessorContextSchema,
  PROFESSOR_CONTEXT_TOOL_FLOW_MODEL,
  professorContextToolFlowResultSchema,
  type AuthorizedProfessorContext,
  type ProfessorContextToolFlowResult,
} from "./professor-context-tool-flow.schemas";
import { GameContextToolError, PositionContextToolError } from "./tool-errors";

export const PROFESSOR_CONTEXT_TOOL_CALL_ID_MAX_LENGTH = 256;

// Ordem estável para inspeção e testes. Ela não representa prioridade semântica.
export const professorContextOpenAITools = [
  getGameContextOpenAITool,
  getPositionContextOpenAITool,
] as const;

type FirstProviderResponse = Pick<
  Response,
  "status" | "output" | "incomplete_details"
>;

type FinalProviderResponse = Pick<
  ParsedResponse<unknown>,
  "status" | "output" | "output_parsed" | "incomplete_details"
>;

export type ProfessorContextToolTransport = {
  createResponse: (
    params: ResponseCreateParamsNonStreaming,
  ) => Promise<FirstProviderResponse>;
  parseResponse: (
    params: ResponseCreateParamsNonStreaming,
  ) => Promise<FinalProviderResponse>;
};

export type ExecuteProfessorGameContextTool = (
  input: ExecuteGetGameContextInput,
) => GetGameContextResult;

export type ExecuteProfessorPositionContextTool = (
  input: ExecuteGetPositionContextInput,
) => GetPositionContextResult;

export type ProfessorContextToolFlowDependencies = {
  transport: ProfessorContextToolTransport;
  executeGameTool?: ExecuteProfessorGameContextTool;
  executePositionTool?: ExecuteProfessorPositionContextTool;
};

export type ProfessorContextToolFlowInput = {
  message: string;
  authorizedContext?: unknown;
  promptVersion: string;
  systemPrompt: string;
};

export type ProfessorContextToolFlowErrorCode =
  | "FIRST_RESPONSE_OUTPUT_INVALID"
  | "MULTIPLE_TOOL_CALLS_UNEXPECTED"
  | "TOOL_NAME_NOT_SUPPORTED"
  | "TOOL_CONTEXT_MISMATCH"
  | "TOOL_CALL_ID_INVALID"
  | "TOOL_ARGUMENTS_JSON_INVALID"
  | "TOOL_ARGUMENTS_INVALID"
  | "SNAPSHOT_MISSING"
  | "SNAPSHOT_INVALID"
  | "GAME_CONTEXT_NOT_AUTHORIZED"
  | "POSITION_CONTEXT_NOT_AUTHORIZED"
  | "TOOL_EXECUTION_FAILED"
  | "FIRST_RESPONSE_INCOMPLETE"
  | "FIRST_RESPONSE_REFUSED"
  | "FINAL_RESPONSE_OUTPUT_INVALID"
  | "FINAL_RESPONSE_INCOMPLETE"
  | "FINAL_RESPONSE_REFUSED"
  | "FINAL_STRUCTURED_OUTPUT_UNAVAILABLE"
  | "PROVIDER_ERROR"
  | "INTERNAL_ERROR";

type SupportedToolName =
  | typeof GET_GAME_CONTEXT_TOOL_NAME
  | typeof GET_POSITION_CONTEXT_TOOL_NAME;

export type ProfessorContextToolFlowStructuralDiagnostic = {
  status: string;
  outputItemTypes: string[] | null;
  messageContentTypes: string[];
  hasOutputParsed: boolean;
  structuredOutputValid: boolean;
  code: "FINAL_RESPONSE_OUTPUT_INVALID";
};

type ProfessorContextToolFlowErrorMetadata = {
  observedToolName?: SupportedToolName;
  structuralDiagnostic?: ProfessorContextToolFlowStructuralDiagnostic;
};

const professorContextToolFlowErrorMetadata = Symbol(
  "professorContextToolFlowErrorMetadata",
);

type ProfessorContextToolFlowErrorOptions = ErrorOptions &
  ProfessorContextToolFlowErrorMetadata;

const flowErrorMessages: Record<ProfessorContextToolFlowErrorCode, string> = {
  FIRST_RESPONSE_OUTPUT_INVALID:
    "O provedor retornou uma primeira resposta em formato inválido.",
  MULTIPLE_TOOL_CALLS_UNEXPECTED:
    "O provedor solicitou mais chamadas de Tool que o fluxo permite.",
  TOOL_NAME_NOT_SUPPORTED: "O provedor solicitou uma Tool não suportada.",
  TOOL_CONTEXT_MISMATCH:
    "A Tool solicitada não é compatível com o contexto autorizado.",
  TOOL_CALL_ID_INVALID:
    "O provedor retornou um identificador de chamada inválido.",
  TOOL_ARGUMENTS_JSON_INVALID:
    "O provedor retornou argumentos de Tool inválidos.",
  TOOL_ARGUMENTS_INVALID: "Os argumentos da Tool solicitada são inválidos.",
  SNAPSHOT_MISSING: "O snapshot autorizado não foi fornecido.",
  SNAPSHOT_INVALID: "O snapshot autorizado é inválido.",
  GAME_CONTEXT_NOT_AUTHORIZED:
    "O contexto de partida solicitado não está autorizado.",
  POSITION_CONTEXT_NOT_AUTHORIZED:
    "O contexto de posição solicitado não está autorizado.",
  TOOL_EXECUTION_FAILED: "Não foi possível executar a Tool solicitada.",
  FIRST_RESPONSE_INCOMPLETE:
    "O provedor não concluiu a seleção de contexto.",
  FIRST_RESPONSE_REFUSED: "O provedor recusou a seleção de contexto.",
  FINAL_RESPONSE_OUTPUT_INVALID:
    "O provedor retornou uma resposta final em formato inválido.",
  FINAL_RESPONSE_INCOMPLETE: "O provedor não concluiu a resposta final.",
  FINAL_RESPONSE_REFUSED: "O provedor recusou a resposta final.",
  FINAL_STRUCTURED_OUTPUT_UNAVAILABLE:
    "Não foi possível obter uma resposta estruturada confiável do provedor.",
  PROVIDER_ERROR: "Não foi possível obter uma resposta do provedor.",
  INTERNAL_ERROR: "Não foi possível concluir o fluxo de seleção de contexto.",
};

export class ProfessorContextToolFlowError extends Error {
  readonly code: ProfessorContextToolFlowErrorCode;
  readonly [professorContextToolFlowErrorMetadata]!:
    ProfessorContextToolFlowErrorMetadata;

  constructor(
    code: ProfessorContextToolFlowErrorCode,
    options?: ProfessorContextToolFlowErrorOptions,
  ) {
    super(
      flowErrorMessages[code],
      options?.cause === undefined ? undefined : { cause: options.cause },
    );
    this.name = "ProfessorContextToolFlowError";
    this.code = code;
    Object.defineProperty(this, professorContextToolFlowErrorMetadata, {
      value: {
        ...(options?.observedToolName === undefined
          ? {}
          : { observedToolName: options.observedToolName }),
        ...(options?.structuralDiagnostic === undefined
          ? {}
          : { structuralDiagnostic: options.structuralDiagnostic }),
      },
      enumerable: false,
      writable: false,
      configurable: false,
    });
  }

  toJSON() {
    return { code: this.code, message: this.message };
  }
}

export function getProfessorContextToolFlowObservedToolName(
  error: unknown,
): SupportedToolName | null {
  if (!(error instanceof ProfessorContextToolFlowError)) return null;
  return (
    error[professorContextToolFlowErrorMetadata].observedToolName ?? null
  );
}

export function getProfessorContextToolFlowStructuralDiagnostic(
  error: unknown,
): ProfessorContextToolFlowStructuralDiagnostic | null {
  if (!(error instanceof ProfessorContextToolFlowError)) return null;
  const diagnostic =
    error[professorContextToolFlowErrorMetadata].structuralDiagnostic;
  return diagnostic === undefined
    ? null
    : {
        ...diagnostic,
        outputItemTypes:
          diagnostic.outputItemTypes === null
            ? null
            : [...diagnostic.outputItemTypes],
        messageContentTypes: [...diagnostic.messageContentTypes],
      };
}

type ParsedFunctionCall = {
  name: SupportedToolName;
  callId: string;
  rawArguments: unknown;
};

function validateAuthorizedContext(value: unknown): AuthorizedProfessorContext {
  const parsed = authorizedProfessorContextSchema.safeParse(value);
  if (!parsed.success) {
    if (value === null || value === undefined) {
      throw new ProfessorContextToolFlowError("SNAPSHOT_MISSING");
    }
    throw new ProfessorContextToolFlowError("SNAPSHOT_INVALID");
  }

  if (
    parsed.data.type === "game" &&
    parsed.data.snapshot.ownerUserId !== parsed.data.snapshot.requestingUserId
  ) {
    throw new ProfessorContextToolFlowError("GAME_CONTEXT_NOT_AUTHORIZED");
  }

  return parsed.data;
}

const responseItemStatuses = new Set([
  "in_progress",
  "completed",
  "incomplete",
]);

function isResponseItemStatus(value: unknown): boolean {
  return typeof value === "string" && responseItemStatuses.has(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasValidOptionalStatus(value: Record<string, unknown>): boolean {
  return value.status === undefined || isResponseItemStatus(value.status);
}

function isLogprobCandidate(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.token === "string" &&
    Array.isArray(value.bytes) &&
    value.bytes.every((byte) => typeof byte === "number") &&
    typeof value.logprob === "number"
  );
}

function isLogprob(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.token === "string" &&
    Array.isArray(value.bytes) &&
    value.bytes.every((byte) => typeof byte === "number") &&
    typeof value.logprob === "number" &&
    Array.isArray(value.top_logprobs) &&
    value.top_logprobs.every(isLogprobCandidate)
  );
}

function isOutputTextAnnotation(value: unknown): boolean {
  if (!isRecord(value)) return false;
  switch (value.type) {
    case "file_citation":
      return (
        typeof value.file_id === "string" &&
        typeof value.filename === "string" &&
        typeof value.index === "number"
      );
    case "url_citation":
      return (
        typeof value.end_index === "number" &&
        typeof value.start_index === "number" &&
        typeof value.title === "string" &&
        typeof value.url === "string"
      );
    case "container_file_citation":
      return (
        typeof value.container_id === "string" &&
        typeof value.end_index === "number" &&
        typeof value.file_id === "string" &&
        typeof value.filename === "string" &&
        typeof value.start_index === "number"
      );
    case "file_path":
      return (
        typeof value.file_id === "string" &&
        typeof value.index === "number"
      );
    default:
      return false;
  }
}

function isResponseMessageContent(value: unknown): boolean {
  if (!isRecord(value)) return false;

  if (value.type === "refusal") {
    return typeof value.refusal === "string";
  }

  if (value.type === "output_text") {
    return (
      typeof value.text === "string" &&
      Array.isArray(value.annotations) &&
      value.annotations.every(isOutputTextAnnotation) &&
      (value.logprobs === undefined ||
        (Array.isArray(value.logprobs) && value.logprobs.every(isLogprob)))
    );
  }

  return false;
}

function isResponseOutputMessage(value: unknown): value is ResponseOutputMessage {
  if (!isRecord(value)) return false;

  return (
    value.type === "message" &&
    typeof value.id === "string" &&
    value.role === "assistant" &&
    isResponseItemStatus(value.status) &&
    Array.isArray(value.content) &&
    value.content.every(isResponseMessageContent) &&
    (value.phase === undefined ||
      value.phase === null ||
      value.phase === "commentary" ||
      value.phase === "final_answer")
  );
}

function isReasoningPart(value: unknown, type: "summary_text" | "reasoning_text") {
  return (
    isRecord(value) &&
    value.type === type &&
    typeof value.text === "string"
  );
}

function isResponseReasoningItem(value: unknown): value is ResponseReasoningItem {
  if (!isRecord(value)) return false;

  return (
    value.type === "reasoning" &&
    typeof value.id === "string" &&
    Array.isArray(value.summary) &&
    value.summary.every((part) => isReasoningPart(part, "summary_text")) &&
    (value.content === undefined ||
      (Array.isArray(value.content) &&
        value.content.every((part) =>
          isReasoningPart(part, "reasoning_text"),
        ))) &&
    (value.encrypted_content === undefined ||
      value.encrypted_content === null ||
      typeof value.encrypted_content === "string") &&
    hasValidOptionalStatus(value)
  );
}

function hasValidFunctionCaller(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (!isRecord(value)) return false;
  if (value.type === "direct") {
    return true;
  }
  return (
    value.type === "program" &&
    typeof value.caller_id === "string"
  );
}

function isResponseFunctionToolCall(
  value: unknown,
): value is ResponseFunctionToolCall {
  if (!isRecord(value)) return false;

  return (
    value.type === "function_call" &&
    typeof value.name === "string" &&
    typeof value.call_id === "string" &&
    typeof value.arguments === "string" &&
    (value.id === undefined || typeof value.id === "string") &&
    (value.namespace === undefined || typeof value.namespace === "string") &&
    hasValidFunctionCaller(value.caller) &&
    hasValidOptionalStatus(value)
  );
}

const knownOutputItemTypes = new Set([
  "message",
  "reasoning",
  "function_call",
]);

const knownMessageContentTypes = new Set(["output_text", "refusal"]);

const knownResponseStatuses = new Set([
  "completed",
  "failed",
  "in_progress",
  "cancelled",
  "queued",
  "incomplete",
]);

function sanitizedDiscriminator(
  value: unknown,
  knownValues: ReadonlySet<string>,
): string {
  if (!isRecord(value)) return "non_object";
  if (typeof value.type !== "string") return "missing";
  return knownValues.has(value.type) ? value.type : "unknown";
}

function buildFinalResponseStructuralDiagnostic(
  response: FinalProviderResponse,
  structuredOutputValid: boolean,
): ProfessorContextToolFlowStructuralDiagnostic {
  const outputItemTypes = Array.isArray(response.output)
    ? response.output.map((item) =>
        sanitizedDiscriminator(item, knownOutputItemTypes),
      )
    : null;
  const messageContentTypes = Array.isArray(response.output)
    ? response.output.flatMap((item) => {
        if (!isRecord(item) || item.type !== "message") return [];
        if (!Array.isArray(item.content)) return ["non_array"];
        return item.content.map((content) =>
          sanitizedDiscriminator(content, knownMessageContentTypes),
        );
      })
    : [];

  return {
    status:
      typeof response.status === "string" &&
      knownResponseStatuses.has(response.status)
        ? response.status
        : "unknown",
    outputItemTypes,
    messageContentTypes,
    hasOutputParsed: response.output_parsed !== null &&
      response.output_parsed !== undefined,
    structuredOutputValid,
    code: "FINAL_RESPONSE_OUTPUT_INVALID",
  };
}

function validateOutput(
  output: unknown,
  phase: "first" | "final",
): ResponseOutputItem[] {
  const invalidCode =
    phase === "first"
      ? "FIRST_RESPONSE_OUTPUT_INVALID"
      : "FINAL_RESPONSE_OUTPUT_INVALID";
  if (!Array.isArray(output)) {
    throw new ProfessorContextToolFlowError(invalidCode);
  }

  const validatedOutput: ResponseOutputItem[] = [];
  for (const item of output) {
    if (isResponseReasoningItem(item) || isResponseOutputMessage(item)) {
      validatedOutput.push(item);
      continue;
    }
    if (phase === "first" && isResponseFunctionToolCall(item)) {
      validatedOutput.push(item);
      continue;
    }
    throw new ProfessorContextToolFlowError(invalidCode);
  }

  return validatedOutput;
}

function hasRefusal(output: ResponseOutputItem[]): boolean {
  return output.some((item) => {
    if (item.type !== "message" || !Array.isArray(item.content)) return false;
    return item.content.some(
      (content) =>
        typeof content === "object" &&
        content !== null &&
        "type" in content &&
        content.type === "refusal",
    );
  });
}

function parseOptionalFunctionCall(
  output: ResponseOutputItem[],
): ParsedFunctionCall | null {
  const calls = output.filter(
    (item): item is Extract<ResponseOutputItem, { type: "function_call" }> =>
      item.type === "function_call",
  );

  if (calls.length === 0) return null;
  if (calls.length > 1) {
    throw new ProfessorContextToolFlowError(
      "MULTIPLE_TOOL_CALLS_UNEXPECTED",
    );
  }

  const call = calls[0];
  if (
    call.name !== GET_GAME_CONTEXT_TOOL_NAME &&
    call.name !== GET_POSITION_CONTEXT_TOOL_NAME
  ) {
    throw new ProfessorContextToolFlowError("TOOL_NAME_NOT_SUPPORTED");
  }
  if (
    typeof call.call_id !== "string" ||
    call.call_id.trim().length === 0 ||
    call.call_id.length > PROFESSOR_CONTEXT_TOOL_CALL_ID_MAX_LENGTH
  ) {
    throw new ProfessorContextToolFlowError("TOOL_CALL_ID_INVALID");
  }
  if (typeof call.arguments !== "string") {
    throw new ProfessorContextToolFlowError("TOOL_ARGUMENTS_JSON_INVALID");
  }

  let rawArguments: unknown;
  try {
    rawArguments = JSON.parse(call.arguments) as unknown;
  } catch {
    throw new ProfessorContextToolFlowError("TOOL_ARGUMENTS_JSON_INVALID");
  }

  return { name: call.name, callId: call.call_id, rawArguments };
}

function assertCompatibleContext(
  call: ParsedFunctionCall,
  context: AuthorizedProfessorContext,
): void {
  const compatible =
    (context.type === "game" && call.name === GET_GAME_CONTEXT_TOOL_NAME) ||
    (context.type === "position" &&
      call.name === GET_POSITION_CONTEXT_TOOL_NAME);

  if (!compatible) {
    throw new ProfessorContextToolFlowError("TOOL_CONTEXT_MISMATCH", {
      observedToolName: call.name,
    });
  }
}

function mapGameToolError(error: GameContextToolError): ProfessorContextToolFlowError {
  switch (error.code) {
    case "TOOL_ARGUMENTS_INVALID":
    case "SNAPSHOT_MISSING":
    case "SNAPSHOT_INVALID":
    case "GAME_CONTEXT_NOT_AUTHORIZED":
      return new ProfessorContextToolFlowError(error.code);
    case "INTERNAL_TOOL_ERROR":
      return new ProfessorContextToolFlowError("TOOL_EXECUTION_FAILED");
  }
}

function mapPositionToolError(
  error: PositionContextToolError,
): ProfessorContextToolFlowError {
  switch (error.code) {
    case "TOOL_ARGUMENTS_INVALID":
    case "SNAPSHOT_MISSING":
    case "SNAPSHOT_INVALID":
    case "POSITION_CONTEXT_NOT_AUTHORIZED":
      return new ProfessorContextToolFlowError(error.code);
    case "INTERNAL_TOOL_ERROR":
      return new ProfessorContextToolFlowError("TOOL_EXECUTION_FAILED");
  }
}

function executeCall(
  call: ParsedFunctionCall,
  context: AuthorizedProfessorContext,
  dependencies: ProfessorContextToolFlowDependencies,
): ResponseInputItem.FunctionCallOutput {
  assertCompatibleContext(call, context);

  let result: GetGameContextResult | GetPositionContextResult;
  try {
    if (call.name === GET_GAME_CONTEXT_TOOL_NAME && context.type === "game") {
      result = (dependencies.executeGameTool ?? executeGetGameContext)({
        rawArguments: call.rawArguments,
        authorizedSnapshot: context.snapshot,
      });
      const parsed = getGameContextResultSchema.safeParse(result);
      if (!parsed.success) {
        throw new ProfessorContextToolFlowError("TOOL_EXECUTION_FAILED");
      }
      result = parsed.data;
    } else if (
      call.name === GET_POSITION_CONTEXT_TOOL_NAME &&
      context.type === "position"
    ) {
      result = (dependencies.executePositionTool ?? executeGetPositionContext)({
        rawArguments: call.rawArguments,
        authorizedSnapshot: context.snapshot,
      });
      const parsed = getPositionContextResultSchema.safeParse(result);
      if (!parsed.success) {
        throw new ProfessorContextToolFlowError("TOOL_EXECUTION_FAILED");
      }
      result = parsed.data;
    } else {
      throw new ProfessorContextToolFlowError("TOOL_CONTEXT_MISMATCH");
    }
  } catch (error: unknown) {
    if (error instanceof ProfessorContextToolFlowError) throw error;
    if (error instanceof GameContextToolError) throw mapGameToolError(error);
    if (error instanceof PositionContextToolError) {
      throw mapPositionToolError(error);
    }
    throw new ProfessorContextToolFlowError("TOOL_EXECUTION_FAILED");
  }

  return {
    type: "function_call_output",
    call_id: call.callId,
    output: JSON.stringify({ success: true, data: result }),
  };
}

function buildTechnicalContext(context: AuthorizedProfessorContext): string {
  switch (context.type) {
    case "game":
      return JSON.stringify({
        type: context.type,
        gameContextId: context.snapshot.gameContextId,
      });
    case "position":
      return JSON.stringify({
        type: context.type,
        positionContextId: context.snapshot.positionContextId,
      });
    case "none":
      return JSON.stringify({ type: context.type });
  }
}

function buildOriginalInput(
  message: string,
  context: AuthorizedProfessorContext,
): ResponseInputItem[] {
  return [
    { role: "user", content: message },
    { role: "developer", content: buildTechnicalContext(context) },
  ];
}

function buildResult(
  data: ProvisionalTeacherResponse,
  call: ParsedFunctionCall | null,
): ProfessorContextToolFlowResult {
  return professorContextToolFlowResultSchema.parse({
    data,
    toolDecision:
      call === null
        ? {
            status: "not_called",
            name: null,
            callCount: 0,
            executionStatus: "not_executed",
          }
        : {
            status: "called",
            name: call.name,
            callCount: 1,
            executionStatus: "completed",
          },
  });
}

async function runValidatedProfessorContextToolFlow(
  input: ProfessorContextToolFlowInput,
  dependencies: ProfessorContextToolFlowDependencies,
): Promise<ProfessorContextToolFlowResult> {
  const context = validateAuthorizedContext(input.authorizedContext);
  const originalInput = buildOriginalInput(input.message, context);

  let firstResponse: FirstProviderResponse;
  try {
    firstResponse = await dependencies.transport.createResponse({
      model: PROFESSOR_CONTEXT_TOOL_FLOW_MODEL,
      instructions: input.systemPrompt,
      input: originalInput,
      tools: [...professorContextOpenAITools],
      tool_choice: "auto",
      parallel_tool_calls: false,
      store: false,
    });
  } catch (error: unknown) {
    throw new ProfessorContextToolFlowError("PROVIDER_ERROR", { cause: error });
  }

  const firstOutput = validateOutput(firstResponse.output, "first");
  if (hasRefusal(firstOutput)) {
    throw new ProfessorContextToolFlowError("FIRST_RESPONSE_REFUSED");
  }
  if (firstResponse.status !== "completed") {
    throw new ProfessorContextToolFlowError("FIRST_RESPONSE_INCOMPLETE");
  }

  const call = parseOptionalFunctionCall(firstOutput);
  const functionCallOutput =
    call === null ? null : executeCall(call, context, dependencies);
  // O SDK 6.47.0 não torna toda a união ResponseOutputItem atribuível à união
  // ResponseInputItem para algumas Tools embutidas. O protocolo exige preservar
  // todos os itens; a adaptação fica localizada após a concatenação integral.
  const finalInput = [
    ...originalInput,
    ...firstOutput,
    ...(functionCallOutput === null ? [] : [functionCallOutput]),
  ] as unknown as ResponseInput;

  let finalResponse: FinalProviderResponse;
  try {
    finalResponse = await dependencies.transport.parseResponse({
      model: PROFESSOR_CONTEXT_TOOL_FLOW_MODEL,
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
    throw new ProfessorContextToolFlowError("PROVIDER_ERROR", { cause: error });
  }

  const parsedOutput = provisionalTeacherResponseSchema.safeParse(
    finalResponse.output_parsed,
  );
  let finalOutput: ResponseOutputItem[];
  try {
    finalOutput = validateOutput(finalResponse.output, "final");
  } catch (error: unknown) {
    if (
      error instanceof ProfessorContextToolFlowError &&
      error.code === "FINAL_RESPONSE_OUTPUT_INVALID"
    ) {
      throw new ProfessorContextToolFlowError(
        "FINAL_RESPONSE_OUTPUT_INVALID",
        {
          structuralDiagnostic: buildFinalResponseStructuralDiagnostic(
            finalResponse,
            parsedOutput.success,
          ),
        },
      );
    }
    throw error;
  }
  if (hasRefusal(finalOutput)) {
    throw new ProfessorContextToolFlowError("FINAL_RESPONSE_REFUSED");
  }
  if (finalResponse.status !== "completed") {
    throw new ProfessorContextToolFlowError("FINAL_RESPONSE_INCOMPLETE");
  }

  if (!parsedOutput.success) {
    throw new ProfessorContextToolFlowError(
      "FINAL_STRUCTURED_OUTPUT_UNAVAILABLE",
    );
  }

  return buildResult(parsedOutput.data, call);
}

export async function runProfessorContextToolFlow(
  input: ProfessorContextToolFlowInput,
  dependencies: ProfessorContextToolFlowDependencies,
): Promise<ProfessorContextToolFlowResult> {
  try {
    return await runValidatedProfessorContextToolFlow(input, dependencies);
  } catch (error: unknown) {
    if (error instanceof ProfessorContextToolFlowError) throw error;
    throw new ProfessorContextToolFlowError("INTERNAL_ERROR");
  }
}
