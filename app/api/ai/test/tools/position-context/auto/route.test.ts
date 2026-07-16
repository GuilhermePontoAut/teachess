import assert from "node:assert/strict";
import { test } from "node:test";
import type { AutoPositionContextToolFlowErrorCode } from "@/lib/ai/tools/auto-position-context-tool-flow";
import { autoFlowErrorStatus, POST } from "./route";

const FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const validBody = {
  message: "Qual é o lado a mover na posição selecionada?",
  authorizedSnapshot: {
    positionContextId: "position-auto-01",
    fen: FEN,
    imageOrigin: "physical_board_photo",
    sourceContext: "personal_study",
    recognitionStatus: "demo_available",
    dataNature: "simulated_demo",
    confirmationStatus: "confirmed",
  },
};

const expectedFlowStatuses = {
  POSITION_CONTEXT_NOT_AUTHORIZED: 403,
  PROVIDER_ERROR: 502,
  FIRST_RESPONSE_INCOMPLETE: 502,
  FIRST_RESPONSE_REFUSED: 502,
  FINAL_RESPONSE_INCOMPLETE: 502,
  FINAL_RESPONSE_REFUSED: 502,
  FINAL_STRUCTURED_OUTPUT_UNAVAILABLE: 502,
  MULTIPLE_TOOL_CALLS_UNEXPECTED: 502,
  TOOL_NAME_NOT_SUPPORTED: 502,
  TOOL_CALL_ID_INVALID: 502,
  TOOL_ARGUMENTS_JSON_INVALID: 502,
  TOOL_ARGUMENTS_INVALID: 502,
  TOOL_EXECUTION_FAILED: 500,
  SNAPSHOT_MISSING: 500,
  SNAPSHOT_INVALID: 500,
} as const satisfies Record<AutoPositionContextToolFlowErrorCode, number>;

type ManagedEnvironment = {
  ENABLE_AI_TEST_ROUTE?: string;
  AI_TEST_PROMPT_VERSION?: string;
  OPENAI_API_KEY?: string;
};

async function withEnvironment<T>(
  environment: ManagedEnvironment,
  operation: () => Promise<T>,
): Promise<T> {
  const keys = Object.keys(environment) as Array<keyof ManagedEnvironment>;
  const original = Object.fromEntries(
    keys.map((key) => [key, process.env[key]]),
  ) as ManagedEnvironment;

  for (const key of keys) {
    const value = environment[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    return await operation();
  } finally {
    for (const key of keys) {
      const value = original[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

function request(body: string): Request {
  return new Request(
    "http://localhost/api/ai/test/tools/position-context/auto",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    },
  );
}

async function assertPublicError(
  response: Response,
  status: number,
  code: string,
): Promise<void> {
  assert.equal(response.status, status);
  const payload = (await response.json()) as {
    success: boolean;
    error: { code: string; message: string };
  };
  assert.equal(payload.success, false);
  assert.equal(payload.error.code, code);
  assert.equal(typeof payload.error.message, "string");
  const serialized = JSON.stringify(payload);
  assert.equal(serialized.includes(FEN), false);
  assert.equal(serialized.includes("position-auto-01"), false);
}

test("classificação HTTP automática cobre exaustivamente os erros do fluxo", () => {
  for (const [code, status] of Object.entries(expectedFlowStatuses)) {
    assert.equal(
      autoFlowErrorStatus(code as AutoPositionContextToolFlowErrorCode),
      status,
      code,
    );
  }
});

test(
  "POST automático valida flag, prompt e body antes de criar o cliente",
  { concurrency: false },
  async (context) => {
    await context.test("rota desabilitada retorna 404 antes de ler JSON", async () => {
      for (const enabled of [undefined, "false", "TRUE"]) {
        await withEnvironment(
          {
            ENABLE_AI_TEST_ROUTE: enabled,
            AI_TEST_PROMPT_VERSION: "versao-inexistente",
            OPENAI_API_KEY: undefined,
          },
          async () => {
            const response = await POST(request("{json-invalido"));
            assert.equal(response.status, 404);
            assert.equal(await response.text(), "");
          },
        );
      }
    });

    await context.test("prompt desconhecido precede JSON e provider", async () => {
      await withEnvironment(
        {
          ENABLE_AI_TEST_ROUTE: "true",
          AI_TEST_PROMPT_VERSION: "versao-inexistente",
          OPENAI_API_KEY: undefined,
        },
        async () => {
          await assertPublicError(
            await POST(request("{json-invalido")),
            503,
            "prompt_version_not_configured",
          );
        },
      );
    });

    await context.test("JSON inválido precede a consulta da chave", async () => {
      await withEnvironment(
        {
          ENABLE_AI_TEST_ROUTE: "true",
          AI_TEST_PROMPT_VERSION: "professor-ia-v2",
          OPENAI_API_KEY: undefined,
        },
        async () => {
          await assertPublicError(
            await POST(request("{json-invalido")),
            400,
            "invalid_json",
          );
        },
      );
    });

    await context.test("body inválido precede a consulta da chave", async () => {
      await withEnvironment(
        {
          ENABLE_AI_TEST_ROUTE: "true",
          AI_TEST_PROMPT_VERSION: "professor-ia-v2",
          OPENAI_API_KEY: undefined,
        },
        async () => {
          for (const body of [
            { message: validBody.message },
            { authorizedSnapshot: validBody.authorizedSnapshot },
            { ...validBody, message: "   " },
            { ...validBody, message: "a".repeat(2_001) },
            {
              message: validBody.message,
              authorizedSnapshot: { positionContextId: "position-auto-01" },
            },
            {
              ...validBody,
              authorizedSnapshot: {
                ...validBody.authorizedSnapshot,
                privateNotes: "não permitido",
              },
            },
          ]) {
            await assertPublicError(
              await POST(request(JSON.stringify(body))),
              400,
              "invalid_body",
            );
          }
        },
      );
    });

    await context.test("chave ausente só é consultada após body válido", async () => {
      await withEnvironment(
        {
          ENABLE_AI_TEST_ROUTE: "true",
          AI_TEST_PROMPT_VERSION: "professor-ia-v2",
          OPENAI_API_KEY: undefined,
        },
        async () => {
          await assertPublicError(
            await POST(request(JSON.stringify(validBody))),
            503,
            "server_not_configured",
          );
        },
      );
    });
  },
);
