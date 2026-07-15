import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { getOpenAIClient, MissingOpenAIApiKeyError } from "@/lib/ai/openai-client";
import {
  PROFESSOR_IA_PROMPT_VERSION,
  PROFESSOR_IA_SYSTEM_PROMPT,
} from "@/lib/ai/prompts/professor-ia-system-prompt-v1";
import {
  PROVISIONAL_TEACHER_RESPONSE_SCHEMA_VERSION,
  provisionalTeacherResponseSchema,
  type ProvisionalTeacherResponse,
} from "@/lib/ai/schemas/provisional-teacher-response";
import {
  parseAiTestMessage,
  type AiTestMessageErrorCode,
} from "@/lib/ai/test-route-message";

export const runtime = "nodejs";

const MODEL = "gpt-5-mini";

type ErrorCode =
  | AiTestMessageErrorCode
  | "server_not_configured"
  | "incomplete_response"
  | "provider_refusal"
  | "structured_output_unavailable"
  | "provider_error";

function errorResponse(code: ErrorCode, message: string, status: number): Response {
  return Response.json(
    {
      success: false,
      error: { code, message },
    },
    { status },
  );
}

function hasRefusal(response: Awaited<ReturnType<OpenAI["responses"]["parse"]>>): boolean {
  return response.output.some(
    (item) =>
      item.type === "message" && item.content.some((content) => content.type === "refusal"),
  );
}

export async function POST(request: Request): Promise<Response> {
  // Rota técnica temporária; não integra o Professor IA e permanece desabilitada por padrão.
  if (process.env.ENABLE_AI_TEST_ROUTE !== "true") {
    return new Response(null, { status: 404 });
  }

  const parsedMessage = await parseAiTestMessage(request);

  if (!parsedMessage.success) {
    return errorResponse(parsedMessage.code, parsedMessage.message, 400);
  }

  try {
    const client = getOpenAIClient();
    const response = await client.responses.parse({
      model: MODEL,
      instructions: PROFESSOR_IA_SYSTEM_PROMPT,
      input: parsedMessage.message,
      text: {
        format: zodTextFormat(provisionalTeacherResponseSchema, "provisional_teacher_response"),
      },
      store: false,
    });

    if (hasRefusal(response)) {
      console.error("[api/ai/test/structured] A OpenAI recusou a solicitação.");
      return errorResponse(
        "provider_refusal",
        "O provedor recusou a solicitação e não produziu uma resposta estruturada.",
        422,
      );
    }

    if (response.status !== "completed") {
      console.error("[api/ai/test/structured] A OpenAI retornou uma resposta incompleta.", {
        status: response.status,
        reason: response.incomplete_details?.reason,
      });
      return errorResponse(
        "incomplete_response",
        "O provedor não concluiu a resposta estruturada.",
        502,
      );
    }

    if (!response.output_parsed) {
      console.error("[api/ai/test/structured] A OpenAI não retornou output estruturado parseado.");
      return errorResponse(
        "structured_output_unavailable",
        "Não foi possível obter uma resposta estruturada confiável do provedor.",
        502,
      );
    }

    const data: ProvisionalTeacherResponse = response.output_parsed;

    return Response.json({
      success: true,
      model: MODEL,
      promptVersion: PROFESSOR_IA_PROMPT_VERSION,
      schemaVersion: PROVISIONAL_TEACHER_RESPONSE_SCHEMA_VERSION,
      data,
    });
  } catch (error: unknown) {
    if (error instanceof MissingOpenAIApiKeyError) {
      console.error("[api/ai/test/structured] OPENAI_API_KEY não está configurada no servidor.");
      return errorResponse(
        "server_not_configured",
        "A integração de IA não está configurada no servidor.",
        503,
      );
    }

    if (error instanceof OpenAI.APIError) {
      console.error("[api/ai/test/structured] Falha na chamada à OpenAI.", {
        status: error.status,
      });
    } else {
      console.error("[api/ai/test/structured] Falha ao processar a resposta estruturada.");
    }

    return errorResponse("provider_error", "Não foi possível obter uma resposta do provedor.", 502);
  }
}
