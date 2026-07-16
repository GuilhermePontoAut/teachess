import type { ResponseCreateParamsNonStreaming } from "openai/resources/responses/responses";
import { getOpenAIClient, MissingOpenAIApiKeyError } from "@/lib/ai/openai-client";
import { getSafeOpenAIErrorDiagnostic } from "@/lib/ai/openai-error-diagnostic";
import {
  selectProfessorIaPrompt,
  UnknownProfessorIaPromptVersionError,
} from "@/lib/ai/prompts/professor-ia-prompts";
import {
  PositionContextToolFlowError,
  positionContextToolRequestSchema,
  runPositionContextToolFlow,
  type PositionContextToolFlowErrorCode,
  type PositionContextToolTransport,
} from "@/lib/ai/tools/position-context-tool-flow";

export const runtime = "nodejs";

function errorResponse(code: string, message: string, status: number): Response {
  return Response.json({ success: false, error: { code, message } }, { status });
}

function assertNever(value: never): never {
  throw new Error(`Código de erro não classificado: ${String(value)}`);
}

export function flowErrorStatus(code: PositionContextToolFlowErrorCode): number {
  switch (code) {
    case "POSITION_CONTEXT_NOT_AUTHORIZED":
      return 403;
    case "PROVIDER_ERROR":
    case "FIRST_RESPONSE_INCOMPLETE":
    case "FIRST_RESPONSE_REFUSED":
    case "FINAL_RESPONSE_INCOMPLETE":
    case "FINAL_RESPONSE_REFUSED":
    case "FINAL_STRUCTURED_OUTPUT_UNAVAILABLE":
    case "TOOL_CALL_MISSING":
    case "MULTIPLE_TOOL_CALLS_UNEXPECTED":
    case "TOOL_NAME_NOT_SUPPORTED":
    case "TOOL_CALL_ID_INVALID":
    case "TOOL_ARGUMENTS_JSON_INVALID":
    case "TOOL_ARGUMENTS_INVALID":
      return 502;
    case "TOOL_EXECUTION_FAILED":
    case "SNAPSHOT_MISSING":
    case "SNAPSHOT_INVALID":
      return 500;
    default:
      return assertNever(code);
  }
}

async function handleEnabledRequest(request: Request): Promise<Response> {
  const selectedPrompt = selectProfessorIaPrompt(
    process.env.AI_TEST_PROMPT_VERSION,
  );
  let rawBody: unknown;

  try {
    rawBody = (await request.json()) as unknown;
  } catch {
    return errorResponse(
      "invalid_json",
      "O corpo da requisição deve ser JSON válido.",
      400,
    );
  }

  const parsedBody = positionContextToolRequestSchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return errorResponse("invalid_body", "O corpo da requisição é inválido.", 400);
  }

  const client = getOpenAIClient();
  const transport: PositionContextToolTransport = {
    createResponse: (params: ResponseCreateParamsNonStreaming) =>
      client.responses.create(params),
    parseResponse: (params: ResponseCreateParamsNonStreaming) =>
      client.responses.parse(params),
  };
  const result = await runPositionContextToolFlow(
    {
      ...parsedBody.data,
      promptVersion: selectedPrompt.version,
      systemPrompt: selectedPrompt.systemPrompt,
    },
    transport,
  );

  return Response.json({ success: true, ...result });
}

export async function POST(request: Request): Promise<Response> {
  if (process.env.ENABLE_AI_TEST_ROUTE !== "true") {
    return new Response(null, { status: 404 });
  }

  try {
    return await handleEnabledRequest(request);
  } catch (error: unknown) {
    if (error instanceof UnknownProfessorIaPromptVersionError) {
      console.error(
        "[api/ai/test/tools/position-context] prompt_version_not_configured",
      );
      return errorResponse(
        "prompt_version_not_configured",
        "A versão configurada para esta rota técnica é inválida.",
        503,
      );
    }
    if (error instanceof MissingOpenAIApiKeyError) {
      console.error("[api/ai/test/tools/position-context] server_not_configured");
      return errorResponse(
        "server_not_configured",
        "A integração de IA não está configurada no servidor.",
        503,
      );
    }
    if (error instanceof PositionContextToolFlowError) {
      if (error.code === "PROVIDER_ERROR") {
        console.error(
          "[api/ai/test/tools/position-context] provider_error",
          getSafeOpenAIErrorDiagnostic(error.cause),
        );
      } else {
        console.error(`[api/ai/test/tools/position-context] ${error.code}`);
      }
      return errorResponse(
        error.code,
        error.message,
        flowErrorStatus(error.code),
      );
    }

    console.error(
      "[api/ai/test/tools/position-context] internal_error",
    );
    return errorResponse(
      "internal_error",
      "Não foi possível concluir a solicitação.",
      500,
    );
  }
}
