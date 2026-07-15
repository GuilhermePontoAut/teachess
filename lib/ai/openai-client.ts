import OpenAI from "openai";

export class MissingOpenAIApiKeyError extends Error {
  constructor() {
    super("OPENAI_API_KEY is not configured.");
    this.name = "MissingOpenAIApiKeyError";
  }
}

let openAIClient: OpenAI | undefined;

export function getOpenAIClient(): OpenAI {
  if (openAIClient) {
    return openAIClient;
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey?.trim()) {
    throw new MissingOpenAIApiKeyError();
  }

  openAIClient = new OpenAI({ apiKey });

  return openAIClient;
}
