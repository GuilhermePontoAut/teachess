import OpenAI from "openai";
import { getOpenAIClient, MissingOpenAIApiKeyError } from "@/lib/ai/openai-client";

export const runtime = "nodejs";

const MODEL = "gpt-5-mini";
const MAX_MESSAGE_LENGTH = 2_000;
const TEMPORARY_INSTRUCTIONS = "Responda de forma breve e clara em português do Brasil.";

type ErrorCode =
  | "invalid_json"
  | "invalid_body"
  | "missing_message"
  | "invalid_message"
  | "empty_message"
  | "message_too_long"
  | "server_not_configured"
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

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: Request): Promise<Response> {
  // Rota técnica temporária para diagnóstico server-side; não é o endpoint do Professor IA.
  if (process.env.ENABLE_AI_TEST_ROUTE !== "true") {
    return new Response(null, { status: 404 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse("invalid_json", "O corpo da requisição deve conter JSON válido.", 400);
  }

  if (!isJsonObject(body)) {
    return errorResponse("invalid_body", "O corpo da requisição deve ser um objeto JSON.", 400);
  }

  if (!("message" in body)) {
    return errorResponse("missing_message", "O campo message é obrigatório.", 400);
  }

  if (typeof body.message !== "string") {
    return errorResponse("invalid_message", "O campo message deve ser uma string.", 400);
  }

  const message = body.message.trim();

  if (!message) {
    return errorResponse("empty_message", "O campo message não pode estar vazio.", 400);
  }

  if (body.message.length > MAX_MESSAGE_LENGTH) {
    return errorResponse(
      "message_too_long",
      `O campo message deve ter no máximo ${MAX_MESSAGE_LENGTH} caracteres.`,
      400,
    );
  }

  try {
    const client = getOpenAIClient();
    const response = await client.responses.create({
      model: MODEL,
      instructions: TEMPORARY_INSTRUCTIONS,
      input: message,
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
