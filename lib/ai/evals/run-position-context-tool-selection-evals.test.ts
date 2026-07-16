import assert from "node:assert/strict";
import { test } from "node:test";
import type { AutoPositionContextToolFlowResult } from "../tools/auto-position-context-tool-flow";
import { AutoPositionContextToolFlowError } from "../tools/auto-position-context-tool-flow";
import {
  POSITION_CONTEXT_TOOL_SELECTION_EVAL_SET_VERSION,
  positionContextToolSelectionCases,
  type PositionContextToolSelectionEvalCase,
} from "./position-context-tool-selection-cases";
import {
  INVALID_POSITION_CONTEXT_TOOL_SELECTION_EVAL_CASE_SET,
  InvalidPositionContextToolSelectionEvalCaseSetError,
  POSITION_CONTEXT_TOOL_SELECTION_EVAL_MAX_REPETITIONS,
  positionContextToolSelectionEvalReportSchema,
  positionContextToolSelectionEvalRunConfigSchema,
  positionContextToolSelectionEvalRunResultSchema,
  positionContextToolSelectionEvalSnapshot,
  runPositionContextToolSelectionEvals,
  type PositionContextToolSelectionEvalExecutor,
  type PositionContextToolSelectionEvalRunnerClock,
} from "./run-position-context-tool-selection-evals";

const prompt = {
  version: "professor-ia-v2",
  systemPrompt: "Prompt simulado do runner.",
} as const;

const baseConfig = {
  model: "gpt-5-mini",
  promptVersion: "professor-ia-v2",
  schemaVersion: "provisional-teacher-response-v1",
  evalSetVersion: POSITION_CONTEXT_TOOL_SELECTION_EVAL_SET_VERSION,
  repetitions: 1,
} as const;

function flowResult(
  decision: "called" | "not_called",
  evidenceStatus: "sufficient" | "partial" | "insufficient" = "partial",
): AutoPositionContextToolFlowResult {
  return {
    model: "gpt-5-mini",
    promptVersion: "professor-ia-v2",
    schemaVersion: "provisional-teacher-response-v1",
    toolSelection:
      decision === "called"
        ? {
            mode: "auto",
            decision: "called",
            availableToolCount: 1,
            callCount: 1,
            toolName: "get_position_context",
            executionStatus: "completed",
          }
        : {
            mode: "auto",
            decision: "not_called",
            availableToolCount: 1,
            callCount: 0,
            toolName: null,
            executionStatus: "not_requested",
          },
    data: {
      summary: "Resposta simulada que não deve aparecer no relatório.",
      observations: [],
      strengths: [],
      improvements: [],
      studyRecommendations: [],
      evidenceUsed: [],
      limitations: [],
      evidenceStatus,
    },
  };
}

function deterministicClock(): PositionContextToolSelectionEvalRunnerClock {
  const dates = [
    new Date("2026-07-16T10:00:00.000Z"),
    new Date("2026-07-16T10:00:01.000Z"),
  ];
  let dateIndex = 0;
  let monotonic = 100;

  return {
    now: () => dates[Math.min(dateIndex++, dates.length - 1)],
    monotonicNow: () => {
      const value = monotonic;
      monotonic += 5;
      return value;
    },
  };
}

function run(
  executeCase: PositionContextToolSelectionEvalExecutor,
  changes: { repetitions?: number; clock?: PositionContextToolSelectionEvalRunnerClock } = {},
) {
  return runPositionContextToolSelectionEvals({
    cases: positionContextToolSelectionCases,
    authorizedSnapshot: positionContextToolSelectionEvalSnapshot,
    config: { ...baseConfig, repetitions: changes.repetitions ?? 1 },
    prompt,
    executeCase,
    clock: changes.clock ?? deterministicClock(),
  });
}

type MutableEvalCase = {
  id: string;
  message: string;
  expectedDecision: string;
  rationale: string;
  prohibitedBehaviors: string[];
  status: string;
};

function mutableCanonicalCases(): MutableEvalCase[] {
  return positionContextToolSelectionCases.map((evalCase) => ({
    ...evalCase,
    prohibitedBehaviors: [...evalCase.prohibitedBehaviors],
  }));
}

async function assertInvalidCaseSetRejected(cases: MutableEvalCase[]) {
  let executeCaseCalls = 0;
  let nowCalls = 0;
  let monotonicNowCalls = 0;
  let reportReturned = false;
  const clock: PositionContextToolSelectionEvalRunnerClock = {
    now: () => {
      nowCalls += 1;
      return new Date("2026-07-16T10:00:00.000Z");
    },
    monotonicNow: () => {
      monotonicNowCalls += 1;
      return 100;
    },
  };

  await assert.rejects(
    async () => {
      await runPositionContextToolSelectionEvals({
        cases: cases as unknown as readonly PositionContextToolSelectionEvalCase[],
        authorizedSnapshot: positionContextToolSelectionEvalSnapshot,
        config: baseConfig,
        prompt,
        executeCase: async () => {
          executeCaseCalls += 1;
          return flowResult("called");
        },
        clock,
      });
      reportReturned = true;
    },
    (error: unknown) => {
      assert.ok(error instanceof InvalidPositionContextToolSelectionEvalCaseSetError);
      assert.equal(error.code, INVALID_POSITION_CONTEXT_TOOL_SELECTION_EVAL_CASE_SET);
      assert.equal("cases" in error, false);

      const serializedError = `${String(error)} ${JSON.stringify(error)}`;
      for (const prohibited of [
        ...cases.map((evalCase) => evalCase.message),
        positionContextToolSelectionEvalSnapshot.fen ?? "",
        positionContextToolSelectionEvalSnapshot.positionContextId,
        "authorizedSnapshot",
        "positionContextId",
      ]) {
        assert.equal(serializedError.includes(prohibited), false, prohibited);
      }
      return true;
    },
  );

  assert.equal(reportReturned, false);
  assert.equal(executeCaseCalls, 0);
  assert.equal(nowCalls, 0);
  assert.equal(monotonicNowCalls, 0);
}

test("configuração aceita repetitions mínimo e máximo", () => {
  assert.equal(
    positionContextToolSelectionEvalRunConfigSchema.safeParse(baseConfig).success,
    true,
  );
  assert.equal(
    positionContextToolSelectionEvalRunConfigSchema.safeParse({
      ...baseConfig,
      repetitions: POSITION_CONTEXT_TOOL_SELECTION_EVAL_MAX_REPETITIONS,
    }).success,
    true,
  );
});

test("configuração rejeita repetitions zero, fracionário e acima do máximo", () => {
  for (const repetitions of [0, 1.5, POSITION_CONTEXT_TOOL_SELECTION_EVAL_MAX_REPETITIONS + 1]) {
    assert.equal(
      positionContextToolSelectionEvalRunConfigSchema.safeParse({
        ...baseConfig,
        repetitions,
      }).success,
      false,
    );
  }
});

test("rejeita qualquer divergência do conjunto canônico antes de executor e relógios", async (t) => {
  const scenarios: Array<{
    name: string;
    alter: (cases: MutableEvalCase[]) => MutableEvalCase[];
  }> = [
    {
      name: "cinco casos",
      alter: (cases) => cases.slice(0, 5),
    },
    {
      name: "sete casos",
      alter: (cases) => [
        ...cases,
        { ...cases[5], id: "AUTO-SEL-007" },
      ],
    },
    {
      name: "ID duplicado",
      alter: (cases) => {
        cases[1].id = cases[0].id;
        return cases;
      },
    },
    {
      name: "ordem diferente",
      alter: (cases) => {
        [cases[0], cases[1]] = [cases[1], cases[0]];
        return cases;
      },
    },
    {
      name: "mensagem modificada",
      alter: (cases) => {
        cases[0].message = "Mensagem adulterada com FEN privado.";
        return cases;
      },
    },
    {
      name: "expectedDecision modificada",
      alter: (cases) => {
        cases[0].expectedDecision = "not_called";
        return cases;
      },
    },
    {
      name: "rationale modificada",
      alter: (cases) => {
        cases[0].rationale = "Justificativa adulterada.";
        return cases;
      },
    },
    {
      name: "status modificado",
      alter: (cases) => {
        cases[0].status = "executed";
        return cases;
      },
    },
    {
      name: "prohibitedBehaviors modificado",
      alter: (cases) => {
        cases[0].prohibitedBehaviors[0] = "Comportamento adulterado.";
        return cases;
      },
    },
    {
      name: "ordem de prohibitedBehaviors modificada",
      alter: (cases) => {
        cases[0].prohibitedBehaviors.reverse();
        return cases;
      },
    },
  ];

  for (const scenario of scenarios) {
    await t.test(scenario.name, async () => {
      await assertInvalidCaseSetRejected(
        scenario.alter(mutableCanonicalCases()),
      );
    });
  }
});

test("executa os seis casos sequencialmente, na ordem e com um único snapshot", async () => {
  const calls: Parameters<PositionContextToolSelectionEvalExecutor>[0][] = [];
  let active = 0;
  let maximumActive = 0;
  const executeCase: PositionContextToolSelectionEvalExecutor = async (input) => {
    active += 1;
    maximumActive = Math.max(maximumActive, active);
    calls.push(input);
    await Promise.resolve();
    active -= 1;
    const evalCase = positionContextToolSelectionCases[calls.length - 1];
    return flowResult(evalCase.expectedDecision);
  };

  const report = await run(executeCase);

  assert.equal(maximumActive, 1);
  assert.deepEqual(
    calls.map((call) => call.message),
    positionContextToolSelectionCases.map((item) => item.message),
  );
  assert.deepEqual(
    report.results.map((result) => result.caseId),
    positionContextToolSelectionCases.map((item) => item.id),
  );
  assert.equal(new Set(calls.map((call) => call.authorizedSnapshot)).size, 1);
  assert.equal(calls.every((call) => call.prompt === prompt), true);
  assert.equal(Object.isFrozen(calls[0].authorizedSnapshot), true);
});

test("duas repetições produzem 12 resultados em ordem previsível", async () => {
  const report = await run(async () => flowResult("called"), { repetitions: 2 });

  assert.equal(report.totalRuns, 12);
  assert.deepEqual(
    report.results.map((result) => `${result.caseId}:${result.runNumber}`),
    positionContextToolSelectionCases.flatMap((item) => [
      `${item.id}:1`,
      `${item.id}:2`,
    ]),
  );
});

test("classifica acertos, falso positivo e falso negativo", async () => {
  const decisions = [
    "called",
    "not_called",
    "not_called",
    "called",
    "not_called",
    "called",
  ] as const;
  let index = 0;
  const report = await run(async () => flowResult(decisions[index++]));

  assert.deepEqual(
    report.results.map((result) => result.classification),
    [
      "correct",
      "false_negative",
      "false_negative",
      "false_positive",
      "correct",
      "false_positive",
    ],
  );
  assert.equal(report.correct, 2);
  assert.equal(report.falsePositives, 2);
  assert.equal(report.falseNegatives, 2);
  assert.equal(report.technicalErrors, 0);
  assert.equal(report.accuracy, 2 / 6);
});

test("erro controlado vira technical_error e não interrompe os casos seguintes", async () => {
  let index = 0;
  const report = await run(async () => {
    index += 1;
    if (index === 2) {
      throw new AutoPositionContextToolFlowError("PROVIDER_ERROR", {
        cause: new Error("segredo do provider"),
      });
    }
    return flowResult(
      positionContextToolSelectionCases[index - 1].expectedDecision,
    );
  });

  assert.equal(report.results.length, 6);
  assert.deepEqual(report.results[1], {
    caseId: "AUTO-SEL-002",
    runNumber: 1,
    expectedDecision: "called",
    actualDecision: null,
    classification: "technical_error",
    latencyMs: 5,
    toolCallCount: null,
    evidenceStatus: null,
    errorCode: "PROVIDER_ERROR",
  });
  assert.equal(report.results[2].classification, "correct");
  assert.equal(report.accuracy, 1);
});

test("erro inesperado e resultado inválido usam somente códigos sanitizados", async () => {
  let index = 0;
  const report = await run(async () => {
    index += 1;
    if (index === 1) {
      throw new Error("stack, chave sk-private e FEN privado");
    }
    if (index === 2) {
      return { secret: "resposta completa" } as unknown as AutoPositionContextToolFlowResult;
    }
    return flowResult(positionContextToolSelectionCases[index - 1].expectedDecision);
  });

  assert.equal(report.results[0].errorCode, "UNEXPECTED_ERROR");
  assert.equal(report.results[1].errorCode, "FLOW_RESULT_INVALID");
  assert.equal(JSON.stringify(report).includes("sk-private"), false);
  assert.equal(JSON.stringify(report).includes("resposta completa"), false);
});

test("accuracy exclui erros técnicos e fica null quando não há decisão válida", async () => {
  const mixed = await run(async ({ message }) => {
    if (message === positionContextToolSelectionCases[0].message) {
      throw new Error("falha");
    }
    return flowResult("not_called");
  });
  assert.equal(mixed.technicalErrors, 1);
  assert.equal(mixed.accuracy, 3 / 5);

  const onlyErrors = await run(async () => {
    throw new Error("falha privada");
  });
  assert.equal(onlyErrors.technicalErrors, 6);
  assert.equal(onlyErrors.accuracy, null);
});

test("timestamps e latências são injetáveis e o relatório passa no schema", async () => {
  const report = await run(async () => flowResult("not_called"));

  assert.equal(report.startedAt, "2026-07-16T10:00:00.000Z");
  assert.equal(report.completedAt, "2026-07-16T10:00:01.000Z");
  assert.equal(report.results.every((result) => result.latencyMs === 5), true);
  assert.equal(positionContextToolSelectionEvalReportSchema.safeParse(report).success, true);
});

test("schema do resultado rejeita combinações semanticamente incoerentes", () => {
  const base = {
    caseId: "AUTO-SEL-001",
    runNumber: 1,
    expectedDecision: "called",
    actualDecision: "called",
    classification: "correct",
    latencyMs: 1,
    toolCallCount: 1,
    evidenceStatus: "sufficient",
    errorCode: null,
  } as const;

  assert.equal(
    positionContextToolSelectionEvalRunResultSchema.safeParse({
      ...base,
      toolCallCount: 0,
    }).success,
    false,
  );
  assert.equal(
    positionContextToolSelectionEvalRunResultSchema.safeParse({
      ...base,
      classification: "technical_error",
    }).success,
    false,
  );
});

test("relatório sanitizado não contém snapshot, FEN, IDs internos ou resposta pedagógica", async () => {
  const report = await run(async () => flowResult("called", "sufficient"));
  const serialized = JSON.stringify(report);

  for (const prohibited of [
    positionContextToolSelectionEvalSnapshot.fen ?? "",
    positionContextToolSelectionEvalSnapshot.positionContextId,
    "authorizedSnapshot",
    "call_id",
    "arguments",
    "Resposta simulada",
    "systemPrompt",
    "sk-",
    "stack",
  ]) {
    assert.equal(serialized.includes(prohibited), false, prohibited);
  }
});

test("runner não muta casos ou snapshot e impede mutação pelo executor", async () => {
  const casesBefore = JSON.stringify(positionContextToolSelectionCases);
  const snapshotBefore = JSON.stringify(positionContextToolSelectionEvalSnapshot);
  let attempts = 0;
  const report = await run(async ({ authorizedSnapshot }) => {
    attempts += 1;
    if (attempts === 1) {
      (authorizedSnapshot as { fen: string | null }).fen = "FEN alterado";
    }
    return flowResult("not_called");
  });

  assert.equal(report.results[0].classification, "technical_error");
  assert.equal(report.results[0].errorCode, "UNEXPECTED_ERROR");
  assert.equal(report.results.length, 6);
  assert.equal(JSON.stringify(positionContextToolSelectionCases), casesBefore);
  assert.equal(JSON.stringify(positionContextToolSelectionEvalSnapshot), snapshotBefore);
});
