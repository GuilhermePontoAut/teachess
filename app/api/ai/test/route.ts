import OpenAI from "openai";
import { getOpenAIClient, MissingOpenAIApiKeyError } from "@/lib/ai/openai-client";
import {
  parseAiTestMessage,
  type AiTestMessageErrorCode,
} from "@/lib/ai/test-route-message";

export const runtime = "nodejs";

const MODEL = "gpt-5-mini";
const TEMPORARY_INSTRUCTIONS = "Responda de forma breve e clara em português do Brasil.";

type ErrorCode = AiTestMessageErrorCode | "server_not_configured" | "provider_error";

function errorResponse(code: ErrorCode, message: string, status: number): Response {
  return Response.json(
    {
      success: false,
      error: { code, message },
    },
    { status },
  );
}

export async function POST(request: Request): Promise<Response> {
  // Rota técnica temporária para diagnóstico server-side; não é o endpoint do Professor IA.
  if (process.env.ENABLE_AI_TEST_ROUTE !== "true") {
    return new Response(null, { status: 404 });
  }

  const parsedMessage = await parseAiTestMessage(request);

  if (!parsedMessage.success) {
    return errorResponse(parsedMessage.code, parsedMessage.message, 400);
  }

  try {
    const client = getOpenAIClient();
    const response = await client.responses.create({
      model: MODEL,
      instructions: TEMPORARY_INSTRUCTIONS,
      input: parsedMessage.message,
      store: false,
    });
    const outputText = response.output_text.trim();

    if (!outputText) {
      console.error("[api/ai/test] A OpenAI retornou uma resposta sem texto.");
      return errorResponse("provider_error", "Não foi possível obter uma resposta do provedor.", 502);
    }

    return Response.json({
      success: true,
      model: MODEL,
      response: outputText,
    });
  } catch (error: unknown) {
    if (error instanceof MissingOpenAIApiKeyError) {
      console.error("[api/ai/test] OPENAI_API_KEY não está configurada no servidor.");
      return errorResponse(
        "server_not_configured",
        "A integração de IA não está configurada no servidor.",
        503,
      );
    }

    if (error instanceof OpenAI.APIError) {
      console.error("[api/ai/test] Falha na chamada à OpenAI.", { status: error.status });
    } else {
      console.error("[api/ai/test] Falha inesperada na integração com a OpenAI.");
    }

    return errorResponse("provider_error", "Não foi possível obter uma resposta do provedor.", 502);
  }
}
