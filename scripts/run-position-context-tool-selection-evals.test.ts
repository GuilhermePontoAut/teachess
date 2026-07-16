import assert from "node:assert/strict";
import { test } from "node:test";
import {
  POSITION_CONTEXT_TOOL_SELECTION_EVAL_REPORT_PATH,
  REAL_AI_EVALS_CONFIGURATION_ERROR_EXIT_CODE,
  REAL_AI_EVALS_DISABLED_EXIT_CODE,
  resolvePositionContextToolSelectionEvalEnvironment,
  runPositionContextToolSelectionEvalCli,
  type EvalEnvironmentReader,
} from "./run-position-context-tool-selection-evals";

const simulatedFinalData = {
  summary: "Resposta pedagógica simulada.",
  observations: [],
  strengths: [],
  improvements: [],
  studyRecommendations: [],
  evidenceUsed: [],
  limitations: [],
  evidenceStatus: "partial" as const,
};

function environmentReader(
  values: Readonly<Record<string, string | undefined>>,
  reads: string[] = [],
): EvalEnvironmentReader {
  return (name) => {
    reads.push(name);
    return values[name];
  };
}

test("opt-in ausente ou incorreto desabilita antes de qualquer outra variável", () => {
  for (const optIn of [undefined, "false", "TRUE", "1"]) {
    const reads: string[] = [];
    const result = resolvePositionContextToolSelectionEvalEnvironment(
      environmentReader({ RUN_REAL_AI_EVALS: optIn }, reads),
    );

    assert.equal(result.status, "disabled");
    assert.equal(result.exitCode, REAL_AI_EVALS_DISABLED_EXIT_CODE);
    assert.deepEqual(reads, ["RUN_REAL_AI_EVALS"]);
  }
});

test("CLI desabilitada não cria cliente, não exige chave e não executa casos", async () => {
  let clientCreations = 0;
  let reportWrites = 0;
  const lines: string[] = [];

  const exitCode = await runPositionContextToolSelectionEvalCli({
    readEnvironment: environmentReader({}),
    createClient: () => {
      clientCreations += 1;
      assert.fail("cliente não deveria ser criado");
    },
    writeJsonReport: async () => {
      reportWrites += 1;
    },
    writeLine: (line) => lines.push(line),
  });

  assert.equal(exitCode, REAL_AI_EVALS_DISABLED_EXIT_CODE);
  assert.equal(clientCreations, 0);
  assert.equal(reportWrites, 0);
  assert.match(lines.join("\n"), /desabilitado/i);
});

test("prompt ausente ou desconhecido é rejeitado antes de repetitions e chave", () => {
  for (const promptVersion of [undefined, "", "professor-ia-v99"]) {
    const reads: string[] = [];
    const result = resolvePositionContextToolSelectionEvalEnvironment(
      environmentReader(
        {
          RUN_REAL_AI_EVALS: "true",
          AI_EVAL_PROMPT_VERSION: promptVersion,
          AI_EVAL_REPETITIONS: "1",
          OPENAI_API_KEY: "sk-never-read",
        },
        reads,
      ),
    );

    assert.equal(result.status, "invalid");
    assert.equal(result.exitCode, REAL_AI_EVALS_CONFIGURATION_ERROR_EXIT_CODE);
    assert.deepEqual(reads, ["RUN_REAL_AI_EVALS", "AI_EVAL_PROMPT_VERSION"]);
  }
});

test("repetitions inválido é rejeitado antes da consulta à API key", () => {
  for (const repetitions of ["0", "1.5", "6", "texto", ""]) {
    const reads: string[] = [];
    const result = resolvePositionContextToolSelectionEvalEnvironment(
      environmentReader(
        {
          RUN_REAL_AI_EVALS: "true",
          AI_EVAL_PROMPT_VERSION: "professor-ia-v2",
          AI_EVAL_REPETITIONS: repetitions,
          OPENAI_API_KEY: "sk-never-read",
        },
        reads,
      ),
    );

    assert.equal(result.status, "invalid");
    assert.equal(
      result.status === "invalid" ? result.errorCode : null,
      "REPETITIONS_INVALID",
    );
    assert.deepEqual(reads, [
      "RUN_REAL_AI_EVALS",
      "AI_EVAL_PROMPT_VERSION",
      "AI_EVAL_REPETITIONS",
    ]);
  }
});

test("repetitions padrão é 1 e chave só é consultada depois das validações", () => {
  const reads: string[] = [];
  const result = resolvePositionContextToolSelectionEvalEnvironment(
    environmentReader(
      {
        RUN_REAL_AI_EVALS: "true",
        AI_EVAL_PROMPT_VERSION: "professor-ia-v2",
        OPENAI_API_KEY: "sk-private-value",
      },
      reads,
    ),
  );

  assert.equal(result.status, "ready");
  if (result.status !== "ready") {
    assert.fail("configuração pronta esperada");
  }
  assert.equal(result.config.repetitions, 1);
  assert.equal(result.config.promptVersion, "professor-ia-v2");
  assert.deepEqual(reads, [
    "RUN_REAL_AI_EVALS",
    "AI_EVAL_PROMPT_VERSION",
    "AI_EVAL_REPETITIONS",
    "OPENAI_API_KEY",
  ]);
  assert.equal(JSON.stringify(result.config).includes("sk-private-value"), false);
  assert.equal("apiKey" in result.config, false);
});

test("chave ausente após configuração válida retorna código sanitizado", () => {
  const result = resolvePositionContextToolSelectionEvalEnvironment(
    environmentReader({
      RUN_REAL_AI_EVALS: "true",
      AI_EVAL_PROMPT_VERSION: "professor-ia-v2",
      AI_EVAL_REPETITIONS: "5",
    }),
  );

  assert.deepEqual(result, {
    status: "invalid",
    exitCode: REAL_AI_EVALS_CONFIGURATION_ERROR_EXIT_CODE,
    errorCode: "OPENAI_API_KEY_REQUIRED",
  });
});

test("CLI autorizada usa transporte simulado, imprime e grava relatório sanitizado", async () => {
  const createMessages: string[] = [];
  let parseCalls = 0;
  const writes: Array<{ path: string; contents: string }> = [];
  const lines: string[] = [];
  const fakeClient = {
    responses: {
      async create(params: { input: unknown }) {
        assert.ok(Array.isArray(params.input));
        const firstInput = params.input[0] as { content?: unknown };
        assert.equal(typeof firstInput.content, "string");
        const message = firstInput.content as string;
        createMessages.push(message);
        const shouldCall = createMessages.length <= 3;
        return {
          status: "completed",
          output: shouldCall
            ? [
                {
                  type: "function_call",
                  name: "get_position_context",
                  call_id: `simulated-call-${createMessages.length}`,
                  arguments: JSON.stringify({
                    positionContextId: "auto-selection-eval-position-01",
                  }),
                },
              ]
            : [],
          incomplete_details: null,
        };
      },
      async parse() {
        parseCalls += 1;
        return {
          status: "completed",
          output: [],
          output_parsed: simulatedFinalData,
          incomplete_details: null,
        };
      },
    },
  };

  const exitCode = await runPositionContextToolSelectionEvalCli({
    readEnvironment: environmentReader({
      RUN_REAL_AI_EVALS: "true",
      AI_EVAL_PROMPT_VERSION: "professor-ia-v2",
      AI_EVAL_REPETITIONS: "1",
      OPENAI_API_KEY: "sk-simulated-only",
    }),
    createClient: () => fakeClient as never,
    writeJsonReport: async (path, contents) => {
      writes.push({ path, contents });
    },
    writeLine: (line) => lines.push(line),
  });

  assert.equal(exitCode, 0);
  assert.equal(createMessages.length, 6);
  assert.equal(parseCalls, 6);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].path, POSITION_CONTEXT_TOOL_SELECTION_EVAL_REPORT_PATH);
  assert.match(lines.join("\n"), /Execuções: 6/);
  assert.match(lines.join("\n"), /Accuracy observada: 100\.00%/);
  for (const prohibited of [
    "rnbqkbnr",
    "auto-selection-eval-position-01",
    "simulated-call",
    "sk-simulated-only",
    "Resposta pedagógica simulada",
  ]) {
    assert.equal(writes[0].contents.includes(prohibited), false, prohibited);
  }
});
