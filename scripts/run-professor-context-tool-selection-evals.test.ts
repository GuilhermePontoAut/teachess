import assert from "node:assert/strict";
import { test } from "node:test";
import {
  professorContextToolSelectionCases,
} from "../lib/ai/evals/professor-context-tool-selection-cases";
import type { ProfessorContextToolSelectionEvalRunnerClock } from "../lib/ai/evals/run-professor-context-tool-selection-evals";
import {
  PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_DISABLED_EXIT_CODE,
  PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_ERROR_EXIT_CODE,
  PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_REPORT_PATH,
  resolveProfessorContextToolSelectionEvalEnvironment,
  runProfessorContextToolSelectionEvalCli,
  type ProfessorContextEvalEnvironmentReader,
} from "./run-professor-context-tool-selection-evals";

function environmentReader(
  values: Readonly<Record<string, string | undefined>>,
  reads: string[] = [],
): ProfessorContextEvalEnvironmentReader {
  return (name) => {
    reads.push(name);
    return values[name];
  };
}

function clock(): ProfessorContextToolSelectionEvalRunnerClock {
  let monotonic = 0;
  let dates = 0;
  return {
    monotonicNow: () => monotonic++,
    now: () =>
      new Date(
        dates++ === 0
          ? "2026-07-16T14:00:00.000Z"
          : "2026-07-16T14:01:00.000Z",
      ),
  };
}

const finalData = {
  summary: "Resposta textual simulada e não persistida.",
  observations: [],
  strengths: [],
  improvements: [],
  studyRecommendations: [],
  evidenceUsed: [],
  limitations: [],
  evidenceStatus: "partial" as const,
};

function fakeClient(options: { repetitions?: number } = {}) {
  const repetitions = options.repetitions ?? 1;
  const state = {
    createCalls: 0,
    parseCalls: 0,
    active: 0,
    maximumActive: 0,
    order: [] as string[],
  };
  return {
    state,
    client: {
      responses: {
        async create(params: { input: unknown }) {
          state.active += 1;
          state.maximumActive = Math.max(state.maximumActive, state.active);
          assert.ok(Array.isArray(params.input));
          const userItem = params.input[0] as { content: string };
          const developerItem = params.input[1] as { content: string };
          const evalCase =
            professorContextToolSelectionCases[
              Math.floor(state.createCalls / repetitions)
            ];
          assert.ok(evalCase);
          assert.equal(evalCase.message, userItem.content);
          state.order.push(evalCase.id);
          state.createCalls += 1;
          await Promise.resolve();
          state.active -= 1;

          const technicalContext = JSON.parse(developerItem.content) as {
            gameContextId?: string;
            positionContextId?: string;
          };
          const output =
            evalCase.expectedDecision === "get_game_context"
              ? [
                  {
                    type: "function_call",
                    name: "get_game_context",
                    call_id: `call-game-${state.createCalls}`,
                    arguments: JSON.stringify({
                      gameContextId: technicalContext.gameContextId,
                    }),
                  },
                ]
              : evalCase.expectedDecision === "get_position_context"
                ? [
                    {
                      type: "function_call",
                      name: "get_position_context",
                      call_id: `call-position-${state.createCalls}`,
                      arguments: JSON.stringify({
                        positionContextId: technicalContext.positionContextId,
                      }),
                    },
                  ]
                : [];
          return {
            status: "completed",
            output,
            incomplete_details: null,
            usage: {
              input_tokens: 10,
              output_tokens: 5,
              total_tokens: 15,
              input_tokens_details: {
                cache_write_tokens: 0,
                cached_tokens: 0,
              },
              output_tokens_details: { reasoning_tokens: 0 },
            },
          };
        },
        async parse() {
          state.parseCalls += 1;
          return {
            status: "completed",
            output: [],
            output_parsed: finalData,
            incomplete_details: null,
            usage: {
              input_tokens: 20,
              output_tokens: 10,
              total_tokens: 30,
              input_tokens_details: {
                cache_write_tokens: 0,
                cached_tokens: 0,
              },
              output_tokens_details: { reasoning_tokens: 0 },
            },
          };
        },
      },
    },
  };
}

function incompatibleToolClient(mode: "supported" | "unknown") {
  const state = { createCalls: 0, parseCalls: 0 };
  return {
    state,
    client: {
      responses: {
        async create(params: { input: unknown }) {
          state.createCalls += 1;
          assert.ok(Array.isArray(params.input));
          const developerItem = params.input[1] as { content: string };
          const technicalContext = JSON.parse(developerItem.content) as {
            type: "game" | "position" | "none";
          };
          const name =
            mode === "unknown"
              ? "unknown_tool_private"
              : technicalContext.type === "game"
                ? "get_position_context"
                : "get_game_context";
          return {
            status: "completed",
            output: [
              {
                type: "function_call",
                name,
                call_id: `private-call-${state.createCalls}`,
                arguments: JSON.stringify({
                  privateArgument: "private-snapshot-id",
                }),
              },
            ],
            incomplete_details: null,
            usage: {
              input_tokens: 10,
              output_tokens: 5,
              total_tokens: 15,
            },
          };
        },
        async parse() {
          state.parseCalls += 1;
          assert.fail("mismatch deve encerrar antes do parse final");
        },
      },
    },
  };
}

const readyEnvironment = {
  RUN_REAL_AI_EVALS: "true",
  AI_EVAL_PROMPT_VERSION: "professor-ia-v2",
  AI_EVAL_REPETITIONS: "1",
  OPENAI_API_KEY: "sk-synthetic-never-sent",
} as const;

test("sem opt-in exato lê somente RUN_REAL_AI_EVALS e retorna código 2", () => {
  for (const value of [undefined, "false", "TRUE", "1"]) {
    const reads: string[] = [];
    const result = resolveProfessorContextToolSelectionEvalEnvironment(
      environmentReader(
        {
          RUN_REAL_AI_EVALS: value,
          AI_EVAL_PROMPT_VERSION: "segredo",
          AI_EVAL_REPETITIONS: "segredo",
          OPENAI_API_KEY: "sk-secret",
        },
        reads,
      ),
    );
    assert.equal(result.status, "disabled");
    assert.equal(result.exitCode, PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_DISABLED_EXIT_CODE);
    assert.deepEqual(reads, ["RUN_REAL_AI_EVALS"]);
  }
});

test("CLI desabilitada emite somente mensagem segura e não cria cliente ou relatório", async () => {
  let clients = 0;
  let writes = 0;
  const lines: string[] = [];
  const exitCode = await runProfessorContextToolSelectionEvalCli({
    readEnvironment: environmentReader({}),
    createClient: () => {
      clients += 1;
      assert.fail("cliente não deveria ser criado");
    },
    writeJsonReport: async () => {
      writes += 1;
    },
    writeLine: (line) => lines.push(line),
  });
  assert.equal(exitCode, 2);
  assert.equal(clients, 0);
  assert.equal(writes, 0);
  assert.equal(lines.length, 1);
  assert.match(lines[0], /desabilitado/i);
  assert.equal(lines[0].includes("OPENAI_API_KEY"), false);
});

test("prompt ausente ou fora de professor-ia-v2/v3 falha antes de repetições e chave", () => {
  for (const value of [undefined, "", "professor-ia-v1", "professor-ia-v99"]) {
    const reads: string[] = [];
    const result = resolveProfessorContextToolSelectionEvalEnvironment(
      environmentReader(
        { ...readyEnvironment, AI_EVAL_PROMPT_VERSION: value },
        reads,
      ),
    );
    assert.equal(result.status, "invalid");
    assert.equal(result.exitCode, 1);
    assert.deepEqual(reads, ["RUN_REAL_AI_EVALS", "AI_EVAL_PROMPT_VERSION"]);
  }
});

test("ambiente aceita professor-ia-v2 e professor-ia-v3 e preserva a versão", () => {
  for (const promptVersion of ["professor-ia-v2", "professor-ia-v3"] as const) {
    const result = resolveProfessorContextToolSelectionEvalEnvironment(
      environmentReader({ ...readyEnvironment, AI_EVAL_PROMPT_VERSION: promptVersion }),
    );
    assert.equal(result.status, "ready");
    if (result.status !== "ready") assert.fail("ambiente pronto esperado");
    assert.equal(result.prompt.version, promptVersion);
    assert.equal(result.config.promptVersion, promptVersion);
  }
});

test("repetições ausentes, zero, negativas, decimais e acima de 5 falham antes da chave", () => {
  for (const value of [undefined, "", "0", "-1", "1.5", "6", "texto"]) {
    const reads: string[] = [];
    const result = resolveProfessorContextToolSelectionEvalEnvironment(
      environmentReader({ ...readyEnvironment, AI_EVAL_REPETITIONS: value }, reads),
    );
    assert.equal(result.status, "invalid");
    assert.equal(result.exitCode, 1);
    assert.deepEqual(reads, [
      "RUN_REAL_AI_EVALS",
      "AI_EVAL_PROMPT_VERSION",
      "AI_EVAL_REPETITIONS",
    ]);
  }
});

test("chave só é consultada depois das configurações e nunca entra no resultado", () => {
  const reads: string[] = [];
  const missing = resolveProfessorContextToolSelectionEvalEnvironment(
    environmentReader({ ...readyEnvironment, OPENAI_API_KEY: undefined }, reads),
  );
  assert.equal(missing.status, "invalid");
  assert.deepEqual(reads, [
    "RUN_REAL_AI_EVALS",
    "AI_EVAL_PROMPT_VERSION",
    "AI_EVAL_REPETITIONS",
    "OPENAI_API_KEY",
  ]);
  assert.equal(JSON.stringify(missing).includes("sk-"), false);

  const ready = resolveProfessorContextToolSelectionEvalEnvironment(
    environmentReader(readyEnvironment),
  );
  assert.equal(ready.status, "ready");
  assert.equal(JSON.stringify(ready).includes("sk-synthetic-never-sent"), false);
});

test("conjunto inválido retorna erro público sanitizado antes de efeitos", async () => {
  let reads = 0;
  let clients = 0;
  let clocks = 0;
  let writes = 0;
  const lines: string[] = [];
  const privateMessage = "Mensagem privada com snapshot secreto";
  const privateIdentifier = "private-context-id-99";
  const cases = professorContextToolSelectionCases.map((evalCase, index) => ({
    ...evalCase,
    message: index === 0 ? privateMessage : evalCase.message,
    rationale:
      index === 0
        ? `Identificador privado ${privateIdentifier}`
        : evalCase.rationale,
    prohibitedBehaviors: [...evalCase.prohibitedBehaviors],
  }));
  const exitCode = await runProfessorContextToolSelectionEvalCli({
    cases,
    readEnvironment: () => {
      reads += 1;
      return undefined;
    },
    createClient: () => {
      clients += 1;
      assert.fail("cliente não deveria ser criado");
    },
    writeJsonReport: async () => {
      writes += 1;
    },
    writeLine: (line) => lines.push(line),
    clock: {
      now: () => {
        clocks += 1;
        return new Date();
      },
      monotonicNow: () => {
        clocks += 1;
        return 0;
      },
    },
  });
  assert.equal(exitCode, 1);
  assert.deepEqual(lines, ["Falha técnica sanitizada: INVALID_EVAL_CASE_SET."]);
  assert.equal(reads, 0);
  assert.equal(clients, 0);
  assert.equal(clocks, 0);
  assert.equal(writes, 0);
  const publicOutput = lines.join("\n");
  for (const forbidden of [privateMessage, "snapshot secreto", privateIdentifier]) {
    assert.equal(publicOutput.includes(forbidden), false, forbidden);
  }
});

test("execução autorizada usa fluxo real, ordem serial e relatório somente em /tmp", async () => {
  const fake = fakeClient();
  const writes: Array<{ path: string; contents: string }> = [];
  const lines: string[] = [];
  let clients = 0;
  const exitCode = await runProfessorContextToolSelectionEvalCli({
    readEnvironment: environmentReader(readyEnvironment),
    createClient: () => {
      clients += 1;
      return fake.client as never;
    },
    writeJsonReport: async (path, contents) => {
      writes.push({ path, contents });
    },
    writeLine: (line) => lines.push(line),
    clock: clock(),
  });

  assert.equal(exitCode, 0);
  assert.equal(clients, 1);
  assert.equal(fake.state.createCalls, 12);
  assert.equal(fake.state.parseCalls, 12);
  assert.equal(fake.state.maximumActive, 1);
  assert.deepEqual(
    fake.state.order,
    professorContextToolSelectionCases.map((evalCase) => evalCase.id),
  );
  assert.equal(writes.length, 1);
  assert.equal(writes[0].path, PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_REPORT_PATH);
  assert.equal(writes[0].path.startsWith("/tmp/"), true);

  const report = JSON.parse(writes[0].contents) as {
    totalRuns: number;
    correct: number;
    tokens: unknown;
    results: unknown[];
  };
  assert.equal(report.totalRuns, 12);
  assert.equal(report.correct, 12);
  assert.deepEqual(report.tokens, {
    sampleCount: 12,
    inputTokens: 360,
    outputTokens: 180,
    totalTokens: 540,
  });
  assert.equal(report.results.length, 12);
  assert.match(lines.join("\n"), /Decision accuracy: 100\.00%/);
  for (const forbidden of [
    "sk-synthetic-never-sent",
    "Resposta textual simulada",
    "professor-eval-game-01",
    "professor-eval-position-01",
    "Synthetic Eval",
    "r3k2r",
    "call-game",
    "call-position",
    "ownerUserId",
    "requestingUserId",
    "stack",
    "cause",
  ]) {
    assert.equal(writes[0].contents.includes(forbidden), false, forbidden);
  }
});

test("três repetições continuam estritamente seriais e produzem 36 execuções", async () => {
  const fake = fakeClient({ repetitions: 3 });
  let reportContents = "";
  const exitCode = await runProfessorContextToolSelectionEvalCli({
    readEnvironment: environmentReader({
      ...readyEnvironment,
      AI_EVAL_REPETITIONS: "3",
    }),
    createClient: () => fake.client as never,
    writeJsonReport: async (_path, contents) => {
      reportContents = contents;
    },
    writeLine: () => undefined,
    clock: clock(),
  });
  assert.equal(exitCode, 0);
  assert.equal(fake.state.createCalls, 36);
  assert.equal(fake.state.parseCalls, 36);
  assert.equal(fake.state.maximumActive, 1);
  assert.equal(
    (JSON.parse(reportContents) as { totalRuns: number }).totalRuns,
    36,
  );
});

test("CLI grava no relatório a versão v3 efetivamente escolhida", async () => {
  const fake = fakeClient();
  let reportContents = "";
  const exitCode = await runProfessorContextToolSelectionEvalCli({
    readEnvironment: environmentReader({
      ...readyEnvironment,
      AI_EVAL_PROMPT_VERSION: "professor-ia-v3",
    }),
    createClient: () => fake.client as never,
    writeJsonReport: async (_path, contents) => {
      reportContents = contents;
    },
    writeLine: () => undefined,
    clock: clock(),
  });
  assert.equal(exitCode, 0);
  assert.equal(
    (JSON.parse(reportContents) as { promptVersion: string }).promptVersion,
    "professor-ia-v3",
  );
});

test("CLI registra Tool suportada incompatível como wrong_tool sem executar ou vazar protocolo", async () => {
  const fake = incompatibleToolClient("supported");
  let reportContents = "";
  const exitCode = await runProfessorContextToolSelectionEvalCli({
    readEnvironment: environmentReader(readyEnvironment),
    createClient: () => fake.client as never,
    writeJsonReport: async (_path, contents) => {
      reportContents = contents;
    },
    writeLine: () => undefined,
    clock: clock(),
  });

  assert.equal(exitCode, 0);
  assert.equal(fake.state.createCalls, 12);
  assert.equal(fake.state.parseCalls, 0);
  const report = JSON.parse(reportContents) as {
    wrongTools: number;
    technicalErrors: number;
    results: Array<{
      caseId: string;
      actualDecision: string | null;
      classification: string;
      toolCallCount: number | null;
    }>;
  };
  assert.equal(report.wrongTools, 12);
  assert.equal(report.technicalErrors, 0);
  assert.equal(
    report.results.find((result) => result.caseId === "GAME-SEL-004")
      ?.actualDecision,
    "get_position_context",
  );
  assert.equal(
    report.results.find((result) => result.caseId === "NO-TOOL-SEL-004")
      ?.actualDecision,
    "get_game_context",
  );
  assert.equal(
    report.results.every(
      (result) =>
        result.classification === "wrong_tool" &&
        result.toolCallCount === 1,
    ),
    true,
  );
  for (const forbidden of [
    "private-call",
    "privateArgument",
    "private-snapshot-id",
    "call_id",
    "arguments",
    "snapshot",
  ]) {
    assert.equal(reportContents.includes(forbidden), false, forbidden);
  }
});

test("CLI mantém Tool desconhecida como erro técnico sanitizado", async () => {
  const fake = incompatibleToolClient("unknown");
  let reportContents = "";
  const exitCode = await runProfessorContextToolSelectionEvalCli({
    readEnvironment: environmentReader(readyEnvironment),
    createClient: () => fake.client as never,
    writeJsonReport: async (_path, contents) => {
      reportContents = contents;
    },
    writeLine: () => undefined,
    clock: clock(),
  });

  assert.equal(exitCode, 0);
  assert.equal(fake.state.createCalls, 12);
  assert.equal(fake.state.parseCalls, 0);
  const report = JSON.parse(reportContents) as {
    wrongTools: number;
    technicalErrors: number;
    results: Array<{ errorCode: string | null }>;
  };
  assert.equal(report.wrongTools, 0);
  assert.equal(report.technicalErrors, 12);
  assert.equal(
    report.results.every(
      (result) => result.errorCode === "TOOL_NAME_NOT_SUPPORTED",
    ),
    true,
  );
  for (const forbidden of [
    "unknown_tool_private",
    "private-call",
    "privateArgument",
    "private-snapshot-id",
  ]) {
    assert.equal(reportContents.includes(forbidden), false, forbidden);
  }
});

test("falha de escrita é sanitizada e retorna código 1", async () => {
  const fake = fakeClient();
  const lines: string[] = [];
  const exitCode = await runProfessorContextToolSelectionEvalCli({
    readEnvironment: environmentReader(readyEnvironment),
    createClient: () => fake.client as never,
    writeJsonReport: async () => {
      throw new Error("/home/user/secret sk-private stack");
    },
    writeLine: (line) => lines.push(line),
    clock: clock(),
  });
  assert.equal(exitCode, PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_ERROR_EXIT_CODE);
  assert.deepEqual(lines, ["Falha técnica sanitizada: REPORT_WRITE_FAILED."]);
});

test("a CLI não modifica o ambiente e o harness restaura os valores temporários", async () => {
  const keys = [
    "RUN_REAL_AI_EVALS",
    "AI_EVAL_PROMPT_VERSION",
    "AI_EVAL_REPETITIONS",
    "OPENAI_API_KEY",
  ] as const;
  const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  try {
    for (const [key, value] of Object.entries(readyEnvironment)) {
      process.env[key] = value;
    }
    const temporary = Object.fromEntries(
      keys.map((key) => [key, process.env[key]]),
    );
    await assert.rejects(
      runProfessorContextToolSelectionEvalCli({
        readEnvironment: (name) => process.env[name],
        createClient: () => {
          throw new Error("falha sintética antes de qualquer chamada externa");
        },
        writeJsonReport: async () => assert.fail("não deveria escrever"),
        writeLine: () => undefined,
      }),
      /falha sintética/,
    );
    for (const key of keys) assert.equal(process.env[key], temporary[key]);
  } finally {
    for (const key of keys) {
      const value = original[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
  for (const key of keys) assert.equal(process.env[key], original[key]);
});
