import type { ResponseCreateParamsNonStreaming } from "openai/resources/responses/responses";
import { getOpenAIClient, MissingOpenAIApiKeyError } from "@/lib/ai/openai-client";
import { getSafeOpenAIErrorDiagnostic } from "@/lib/ai/openai-error-diagnostic";
import {
  selectProfessorIaPrompt,
  UnknownProfessorIaPromptVersionError,
} from "@/lib/ai/prompts/professor-ia-prompts";
import {
  GAME_CONTEXT_TOOL_FLOW_MODEL,
  GameContextToolFlowError,
  gameContextToolRequestSchema,
  runGameContextToolFlow,
  type GameContextToolFlowErrorCode,
  type GameContextToolFlowResult,
  type GameContextToolTransport,
} from "@/lib/ai/tools/game-context-tool-flow";

export const runtime = "nodejs";

// 256 KiB cobrem os máximos atuais de mensagem, PGN, notas, tags e metadados,
// inclusive UTF-8 e escapes JSON, sem permitir leitura sem limite.
export const GAME_CONTEXT_TOOL_REQUEST_MAX_BYTES = 256 * 1024;

function errorResponse(code: string, message: string, status: number): Response {
  return Response.json({ success: false, error: { code, message } }, { status });
}

function assertNever(value: never): never {
  throw new Error(`Código de erro não classificado: ${String(value)}`);
}

export function flowErrorStatus(code: GameContextToolFlowErrorCode): number {
  switch (code) {
    case "GAME_CONTEXT_NOT_AUTHORIZED":
      return 403;
    case "FIRST_RESPONSE_REFUSED":
    case "FINAL_RESPONSE_REFUSED":
      return 422;
    case "PROVIDER_ERROR":
    case "FIRST_RESPONSE_INCOMPLETE":
    case "FINAL_RESPONSE_INCOMPLETE":
    case "FINAL_STRUCTURED_OUTPUT_UNAVAILABLE":
    case "TOOL_CALL_MISSING":
    case "MULTIPLE_TOOL_CALLS_UNEXPECTED":
    case "TOOL_NAME_NOT_SUPPORTED":
    case "TOOL_CALL_ID_INVALID":
    case "TOOL_ARGUMENTS_JSON_INVALID":
    case "TOOL_ARGUMENTS_INVALID":
    case "TOOL_EXECUTION_FAILED":
      return 502;
    case "SNAPSHOT_MISSING":
    case "SNAPSHOT_INVALID":
    case "INTERNAL_ERROR":
      return 500;
    default:
      return assertNever(code);
  }
}

type OpenAIClientLike = {
  responses: {
    create: GameContextToolTransport["createResponse"];
    parse: GameContextToolTransport["parseResponse"];
  };
};

export type GameContextRouteDependencies = {
  getClient: () => OpenAIClientLike;
  runFlow: typeof runGameContextToolFlow;
  diagnoseProviderError: typeof getSafeOpenAIErrorDiagnostic;
  logError: (...values: unknown[]) => void;
};

const defaultDependencies: GameContextRouteDependencies = {
  getClient: getOpenAIClient,
  runFlow: runGameContextToolFlow,
  diagnoseProviderError: getSafeOpenAIErrorDiagnostic,
  logError: console.error,
};

export function createGameContextToolRoute(
  dependencies: GameContextRouteDependencies = defaultDependencies,
) {
  return async function handlePost(request: Request): Promise<Response> {
    if (process.env.ENABLE_AI_TEST_ROUTE !== "true") {
      return new Response(null, { status: 404 });
    }

    try {
      const selectedPrompt = selectProfessorIaPrompt(
        process.env.AI_TEST_PROMPT_VERSION,
      );

      const declaredLength = request.headers.get("content-length");
      if (
        declaredLength !== null &&
        /^\d+$/.test(declaredLength) &&
        Number(declaredLength) > GAME_CONTEXT_TOOL_REQUEST_MAX_BYTES
      ) {
        return errorResponse(
          "request_body_too_large",
          "O corpo da requisição excede o limite permitido.",
          413,
        );
      }

      const bodyText = await request.text();
      if (
        new TextEncoder().encode(bodyText).byteLength >
        GAME_CONTEXT_TOOL_REQUEST_MAX_BYTES
      ) {
        return errorResponse(
          "request_body_too_large",
          "O corpo da requisição excede o limite permitido.",
          413,
        );
      }

      let rawBody: unknown;
      try {
        rawBody = JSON.parse(bodyText) as unknown;
      } catch {
        return errorResponse(
          "invalid_json",
          "O corpo da requisição deve ser JSON válido.",
          400,
        );
      }

      const parsedBody = gameContextToolRequestSchema.safeParse(rawBody);
      if (!parsedBody.success) {
        return errorResponse(
          "invalid_body",
          "O corpo da requisição é inválido.",
          400,
        );
      }

      if (
        parsedBody.data.authorizedSnapshot.ownerUserId !==
        parsedBody.data.authorizedSnapshot.requestingUserId
      ) {
        return errorResponse(
          "GAME_CONTEXT_NOT_AUTHORIZED",
          "O contexto de partida solicitado não está autorizado.",
          403,
        );
      }

      const client = dependencies.getClient();
      const transport: GameContextToolTransport = {
        createResponse: (params: ResponseCreateParamsNonStreaming) =>
          client.responses.create(params),
        parseResponse: (params: ResponseCreateParamsNonStreaming) =>
          client.responses.parse(params),
      };
      const result: GameContextToolFlowResult = await dependencies.runFlow(
        {
          ...parsedBody.data,
          model: GAME_CONTEXT_TOOL_FLOW_MODEL,
          promptVersion: selectedPrompt.version,
          systemPrompt: selectedPrompt.systemPrompt,
        },
        transport,
      );

      return Response.json({ success: true, ...result });
    } catch (error: unknown) {
      if (error instanceof UnknownProfessorIaPromptVersionError) {
        dependencies.logError(
          "[api/ai/test/tools/game-context] prompt_version_not_configured",
        );
        return errorResponse(
          "prompt_version_not_configured",
          "A versão configurada para esta rota técnica é inválida.",
          503,
        );
      }
      if (error instanceof MissingOpenAIApiKeyError) {
        dependencies.logError(
          "[api/ai/test/tools/game-context] server_not_configured",
        );
        return errorResponse(
          "server_not_configured",
          "A integração de IA não está configurada no servidor.",
          503,
        );
      }
      if (error instanceof GameContextToolFlowError) {
        if (error.code === "PROVIDER_ERROR") {
          dependencies.logError(
            "[api/ai/test/tools/game-context] provider_error",
            dependencies.diagnoseProviderError(error.cause),
          );
        } else {
          dependencies.logError(
            `[api/ai/test/tools/game-context] ${error.code}`,
          );
        }
        return errorResponse(
          error.code,
          error.message,
          flowErrorStatus(error.code),
        );
      }

      dependencies.logError("[api/ai/test/tools/game-context] internal_error");
      return errorResponse(
        "internal_error",
        "Não foi possível concluir a solicitação.",
        500,
      );
    }
  };
}

export const POST = createGameContextToolRoute();
