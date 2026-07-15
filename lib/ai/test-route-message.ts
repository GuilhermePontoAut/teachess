const MAX_MESSAGE_LENGTH = 2_000;

export type AiTestMessageErrorCode =
  | "invalid_json"
  | "invalid_body"
  | "missing_message"
  | "invalid_message"
  | "empty_message"
  | "message_too_long";

type AiTestMessageResult =
  | { success: true; message: string }
  | { success: false; code: AiTestMessageErrorCode; message: string };

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function parseAiTestMessage(request: Request): Promise<AiTestMessageResult> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return {
      success: false,
      code: "invalid_json",
      message: "O corpo da requisição deve conter JSON válido.",
    };
  }

  if (!isJsonObject(body)) {
    return {
      success: false,
      code: "invalid_body",
      message: "O corpo da requisição deve ser um objeto JSON.",
    };
  }

  if (!("message" in body)) {
    return {
      success: false,
      code: "missing_message",
      message: "O campo message é obrigatório.",
    };
  }

  if (typeof body.message !== "string") {
    return {
      success: false,
      code: "invalid_message",
      message: "O campo message deve ser uma string.",
    };
  }

  const message = body.message.trim();

  if (!message) {
    return {
      success: false,
      code: "empty_message",
      message: "O campo message não pode estar vazio.",
    };
  }

  if (body.message.length > MAX_MESSAGE_LENGTH) {
    return {
      success: false,
      code: "message_too_long",
      message: `O campo message deve ter no máximo ${MAX_MESSAGE_LENGTH} caracteres.`,
    };
  }

  return { success: true, message };
}
