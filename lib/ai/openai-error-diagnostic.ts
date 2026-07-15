import OpenAI, { type APIError } from "openai";

export type OpenAIErrorClassification =
  | "api_connection_error"
  | "api_connection_timeout_error"
  | "api_error"
  | "unexpected_error";

export type SafeOpenAIErrorDiagnostic = {
  name: string;
  classification: OpenAIErrorClassification;
  status?: number;
  code?: string;
  type?: string;
  requestId?: string;
  message?: string;
};

function getSafeSdkMessage(error: APIError): string | undefined {
  const message = error.message.trim();
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!message || (apiKey && message.includes(apiKey))) {
    return undefined;
  }

  return message;
}

export function getSafeOpenAIErrorDiagnostic(error: unknown): SafeOpenAIErrorDiagnostic {
  let classification: OpenAIErrorClassification;

  if (error instanceof OpenAI.APIConnectionTimeoutError) {
    classification = "api_connection_timeout_error";
  } else if (error instanceof OpenAI.APIConnectionError) {
    classification = "api_connection_error";
  } else if (error instanceof OpenAI.APIError) {
    classification = "api_error";
  } else {
    return {
      name: error instanceof Error ? error.name : "UnknownError",
      classification: "unexpected_error",
    };
  }

  const message = getSafeSdkMessage(error);

  return {
    name: error.name,
    classification,
    ...(error.status !== undefined && { status: error.status }),
    ...(error.code && { code: error.code }),
    ...(error.type && { type: error.type }),
    ...(error.requestID && { requestId: error.requestID }),
    ...(message && { message }),
  };
}
