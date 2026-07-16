import type { ResponseCreateParamsNonStreaming } from "openai/resources/responses/responses";
import { getOpenAIClient, MissingOpenAIApiKeyError } from "@/lib/ai/openai-client";
import { getSafeOpenAIErrorDiagnostic } from "@/lib/ai/openai-error-diagnostic";
import {
  selectProfessorIaPrompt,
  UnknownProfessorIaPromptVersionError,
} from "@/lib/ai/prompts/professor-ia-prompts";
import {
  ProfessorContextToolFlowError,
  runProfessorContextToolFlow,
  type ProfessorContextToolFlowErrorCode,
  type ProfessorContextToolTransport,
} from "@/lib/ai/tools/professor-context-tool-flow";
import {
  professorContextToolRequestSchema,
  type ProfessorContextToolFlowResult,
} from "@/lib/ai/tools/professor-context-tool-flow.schemas";

export const PROFESSOR_CONTEXT_TOOL_REQUEST_MAX_BYTES = 256 * 1024;

function errorResponse(code: string, message: string, status: number): Response {
  return Response.json({ success: false, error: { code, message } }, { status });
}

function assertNever(value: never): never {
  throw new Error(`Código de erro não classificado: ${String(value)}`);
}

export function professorContextFlowErrorStatus(
  code: ProfessorContextToolFlowErrorCode,
): number {
  switch (code) {
    case "SNAPSHOT_MISSING":
    case "SNAPSHOT_INVALID":
      return 400;
    case "GAME_CONTEXT_NOT_AUTHORIZED":
    case "POSITION_CONTEXT_NOT_AUTHORIZED":
      return 403;
    case "FIRST_RESPONSE_REFUSED":
    case "FINAL_RESPONSE_REFUSED":
      return 422;
    case "FIRST_RESPONSE_OUTPUT_INVALID":
    case "MULTIPLE_TOOL_CALLS_UNEXPECTED":
    case "TOOL_NAME_NOT_SUPPORTED":
    case "TOOL_CONTEXT_MISMATCH":
    case "TOOL_CALL_ID_INVALID":
    case "TOOL_ARGUMENTS_JSON_INVALID":
    case "TOOL_ARGUMENTS_INVALID":
    case "TOOL_EXECUTION_FAILED":
    case "FIRST_RESPONSE_INCOMPLETE":
    case "FINAL_RESPONSE_OUTPUT_INVALID":
    case "FINAL_RESPONSE_INCOMPLETE":
    case "FINAL_STRUCTURED_OUTPUT_UNAVAILABLE":
    case "PROVIDER_ERROR":
      return 502;
    case "INTERNAL_ERROR":
      return 500;
    default:
      return assertNever(code);
  }
}

type OpenAIClientLike = {
  responses: {
    create: ProfessorContextToolTransport["createResponse"];
    parse: ProfessorContextToolTransport["parseResponse"];
  };
};

export type ProfessorContextRouteDependencies = {
  getClient: () => OpenAIClientLike;
  runFlow: typeof runProfessorContextToolFlow;
  diagnoseProviderError: typeof getSafeOpenAIErrorDiagnostic;
  logError: (...values: unknown[]) => void;
};

export type ProfessorContextRouteOptions = {
  isEnabled: () => boolean;
  promptVersion: () => string | undefined;
  logPrefix: string;
  promptVersionErrorMessage: string;
};

const defaultDependencies: ProfessorContextRouteDependencies = {
  getClient: getOpenAIClient,
  runFlow: runProfessorContextToolFlow,
  diagnoseProviderError: getSafeOpenAIErrorDiagnostic,
  logError: console.error,
};

export function createProfessorContextRoute(
  options: ProfessorContextRouteOptions,
  dependencies: ProfessorContextRouteDependencies = defaultDependencies,
) {
  return async function handlePost(request: Request): Promise<Response> {
    if (!options.isEnabled()) {
      return new Response(null, { status: 404 });
    }

    try {
      const selectedPrompt = selectProfessorIaPrompt(options.promptVersion());

      const declaredLength = request.headers.get("content-length");
      if (
        declaredLength !== null &&
        /^\d+$/.test(declaredLength) &&
        Number(declaredLength) > PROFESSOR_CONTEXT_TOOL_REQUEST_MAX_BYTES
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
        PROFESSOR_CONTEXT_TOOL_REQUEST_MAX_BYTES
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

      const parsedBody = professorContextToolRequestSchema.safeParse(rawBody);
      if (!parsedBody.success) {
        return errorResponse(
          "invalid_body",
          "O corpo da requisição é inválido.",
          400,
        );
      }

      if (
        parsedBody.data.authorizedContext.type === "game" &&
        parsedBody.data.authorizedContext.snapshot.ownerUserId !==
          parsedBody.data.authorizedContext.snapshot.requestingUserId
      ) {
        return errorResponse(
          "GAME_CONTEXT_NOT_AUTHORIZED",
          "O contexto de partida solicitado não está autorizado.",
          403,
        );
      }

      const client = dependencies.getClient();
      const transport: ProfessorContextToolTransport = {
        createResponse: (params: ResponseCreateParamsNonStreaming) =>
          client.responses.create(params),
        parseResponse: (params: ResponseCreateParamsNonStreaming) =>
          client.responses.parse(params),
      };
      const result: ProfessorContextToolFlowResult = await dependencies.runFlow(
        {
          message: parsedBody.data.message,
          authorizedContext: parsedBody.data.authorizedContext,
          promptVersion: selectedPrompt.version,
          systemPrompt: selectedPrompt.systemPrompt,
        },
        { transport },
      );

      return Response.json({ success: true, ...result });
    } catch (error: unknown) {
      if (error instanceof UnknownProfessorIaPromptVersionError) {
        dependencies.logError(
          `${options.logPrefix} prompt_version_not_configured`,
        );
        return errorResponse(
          "prompt_version_not_configured",
          options.promptVersionErrorMessage,
          503,
        );
      }
      if (error instanceof MissingOpenAIApiKeyError) {
        dependencies.logError(`${options.logPrefix} server_not_configured`);
        return errorResponse(
          "server_not_configured",
          "A integração de IA não está configurada no servidor.",
          503,
        );
      }
      if (error instanceof ProfessorContextToolFlowError) {
        if (error.code === "PROVIDER_ERROR") {
          dependencies.logError(
            `${options.logPrefix} provider_error`,
            dependencies.diagnoseProviderError(error.cause),
          );
        } else {
          dependencies.logError(`${options.logPrefix} ${error.code}`);
        }
        return errorResponse(
          error.code,
          error.message,
          professorContextFlowErrorStatus(error.code),
        );
      }

      dependencies.logError(`${options.logPrefix} internal_error`);
      return errorResponse(
        "internal_error",
        "Não foi possível concluir a solicitação.",
        500,
      );
    }
  };
}
