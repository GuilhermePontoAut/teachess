import assert from "node:assert/strict";
import { test } from "node:test";
import {
  professorContextToolSelectionCases,
} from "./professor-context-tool-selection-cases";
import {
  INVALID_PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_CASE_SET,
  InvalidProfessorContextToolSelectionEvalCaseSetError,
  combineProfessorContextToolSelectionUsages,
  createProfessorContextToolSelectionEvalFixtures,
  professorContextToolSelectionEvalReportSchema,
  professorContextToolSelectionEvalRunConfigSchema,
  professorContextToolSelectionEvalRunResultSchema,
  runProfessorContextToolSelectionEvals,
  type ProfessorContextToolSelectionEvalReport,
  type ProfessorContextToolSelectionEvalExecutionOutcome,
  type ProfessorContextToolSelectionEvalExecutor,
  type ProfessorContextToolSelectionEvalRunnerClock,
} from "./run-professor-context-tool-selection-evals";

const prompt = {
  version: "professor-ia-v2",
  systemPrompt: "Prompt simulado e selecionado.",
} as const;

const baseConfig = {
  model: "gpt-5-mini",
  promptVersion: "professor-ia-v2",
  schemaVersion: "provisional-teacher-response-v1",
  evalSetVersion: "professor-context-tool-selection-evals-v1",
  repetitions: 1,
} as const;

const finalData = {
  summary: "Texto que não deve ser persistido no relatório.",
  observations: [],
  strengths: [],
  improvements: [],
  studyRecommendations: [],
  evidenceUsed: [],
  limitations: [],
  evidenceStatus: "partial" as const,
};

function flowResult(
  decision: "get_game_context" | "get_position_context" | "not_called",
) {
  return {
    data: finalData,
    toolDecision:
      decision === "not_called"
        ? {
            status: "not_called" as const,
            name: null,
            callCount: 0 as const,
            executionStatus: "not_executed" as const,
          }
        : {
            status: "called" as const,
            name: decision,
            callCount: 1 as const,
            executionStatus: "completed" as const,
          },
  };
}

function success(
  decision: "get_game_context" | "get_position_context" | "not_called",
  telemetry: ProfessorContextToolSelectionEvalExecutionOutcome["telemetry"] = {
    firstInteractionLatencyMs: 2,
    finalInteractionLatencyMs: 3,
    tokens: { inputTokens: 12, outputTokens: 8, totalTokens: 20 },
  },
): ProfessorContextToolSelectionEvalExecutionOutcome {
  return { status: "success", flowResult: flowResult(decision), telemetry };
}

function deterministicClock(
  monotonicValues: number[] = Array.from({ length: 24 }, (_, index) => index * 10),
): ProfessorContextToolSelectionEvalRunnerClock {
  const dates = [
    new Date("2026-07-16T12:00:00.000Z"),
    new Date("2026-07-16T12:00:01.000Z"),
  ];
  let dateIndex = 0;
  let monotonicIndex = 0;
  return {
    now: () => dates[Math.min(dateIndex++, dates.length - 1)],
    monotonicNow: () =>
      monotonicValues[
        Math.min(monotonicIndex++, monotonicValues.length - 1)
      ],
  };
}

function run(
  executeCase: ProfessorContextToolSelectionEvalExecutor,
  changes: {
    repetitions?: number;
    cases?: readonly unknown[];
    clock?: ProfessorContextToolSelectionEvalRunnerClock;
  } = {},
) {
  return runProfessorContextToolSelectionEvals({
    cases: changes.cases ?? professorContextToolSelectionCases,
    config: { ...baseConfig, repetitions: changes.repetitions ?? 1 },
    prompt,
    executeCase,
    clock: changes.clock ?? deterministicClock(),
  });
}

function caseForInput(
  input: Parameters<ProfessorContextToolSelectionEvalExecutor>[0],
) {
  const evalCase = professorContextToolSelectionCases.find(
    (candidate) =>
      candidate.message === input.message &&
      candidate.authorizedContextType === input.authorizedContext.type,
  );
  assert.ok(evalCase);
  return evalCase;
}

function mutableCases() {
  return professorContextToolSelectionCases.map((evalCase) => ({
    ...evalCase,
    prohibitedBehaviors: [...evalCase.prohibitedBehaviors],
  }));
}

function cloneReport(
  report: ProfessorContextToolSelectionEvalReport,
): ProfessorContextToolSelectionEvalReport {
  return structuredClone(report);
}

test("configuração aceita somente professor-ia-v2 e repetições de 1 a 5", () => {
  for (const repetitions of [1, 5]) {
    assert.equal(
      professorContextToolSelectionEvalRunConfigSchema.safeParse({
        ...baseConfig,
        repetitions,
      }).success,
      true,
    );
  }
  for (const repetitions of [0, -1, 1.5, 6]) {
    assert.equal(
      professorContextToolSelectionEvalRunConfigSchema.safeParse({
        ...baseConfig,
        repetitions,
      }).success,
      false,
    );
  }
  assert.equal(
    professorContextToolSelectionEvalRunConfigSchema.safeParse({
      ...baseConfig,
      promptVersion: "professor-ia-v1",
    }).success,
    false,
  );
});

test("fixtures sintéticas são válidas, owner-only e profundamente congeladas", () => {
  const fixtures = createProfessorContextToolSelectionEvalFixtures();
  assert.equal(fixtures.game.type, "game");
  assert.equal(fixtures.position.type, "position");
  assert.equal(fixtures.none.type, "none");
  if (fixtures.game.type !== "game" || fixtures.position.type !== "position") {
    assert.fail("fixtures discriminadas esperadas");
  }
  assert.equal(
    fixtures.game.snapshot.ownerUserId,
    fixtures.game.snapshot.requestingUserId,
  );
  assert.match(fixtures.game.snapshot.pgn ?? "", /^\[Event/m);
  assert.equal(fixtures.position.snapshot.confirmationStatus, "confirmed");
  assert.equal(Object.isFrozen(fixtures), true);
  assert.equal(Object.isFrozen(fixtures.game.snapshot), true);
  assert.equal(Object.isFrozen(fixtures.game.snapshot.tags), true);
  assert.equal(Object.isFrozen(fixtures.position.snapshot), true);
});

test("conjunto ausente, extra, reordenado, duplicado ou modificado falha antes de executor e relógios", async (t) => {
  const scenarios: Array<{
    name: string;
    alter: (cases: ReturnType<typeof mutableCases>) => readonly unknown[];
  }> = [
    { name: "ausente", alter: (cases) => cases.slice(0, 11) },
    {
      name: "extra",
      alter: (cases) => [...cases, { ...cases[11], id: "NO-TOOL-SEL-005" }],
    },
    {
      name: "reordenado",
      alter: (cases) => {
        [cases[0], cases[1]] = [cases[1], cases[0]];
        return cases;
      },
    },
    {
      name: "duplicado",
      alter: (cases) => {
        cases[1].id = cases[0].id;
        return cases;
      },
    },
    {
      name: "mensagem modificada",
      alter: (cases) => {
        cases[0].message = "Mensagem com snapshot secreto";
        return cases;
      },
    },
    {
      name: "categoria modificada",
      alter: (cases) => {
        cases[0].category = "no_tool_required";
        return cases;
      },
    },
    {
      name: "propriedade extra",
      alter: (cases) => [{ ...cases[0], extra: true }, ...cases.slice(1)],
    },
  ];

  for (const scenario of scenarios) {
    await t.test(scenario.name, async () => {
      let executorCalls = 0;
      let clockCalls = 0;
      const clock = {
        now: () => {
          clockCalls += 1;
          return new Date();
        },
        monotonicNow: () => {
          clockCalls += 1;
          return 0;
        },
      };
      await assert.rejects(
        run(
          async () => {
            executorCalls += 1;
            return success("not_called");
          },
          { cases: scenario.alter(mutableCases()), clock },
        ),
        (error: unknown) => {
          assert.ok(
            error instanceof InvalidProfessorContextToolSelectionEvalCaseSetError,
          );
          assert.equal(
            error.code,
            INVALID_PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_CASE_SET,
          );
          const serialized = `${String(error)} ${JSON.stringify(error)}`;
          for (const forbidden of [
            "Mensagem com snapshot secreto",
            "professor-eval-game-01",
            "professor-eval-position-01",
          ]) {
            assert.equal(serialized.includes(forbidden), false);
          }
          return true;
        },
      );
      assert.equal(executorCalls, 0);
      assert.equal(clockCalls, 0);
    });
  }
});

test("execução é estritamente sequencial, ordenada por caso e repetição", async () => {
  const calls: Parameters<ProfessorContextToolSelectionEvalExecutor>[0][] = [];
  let active = 0;
  let maximumActive = 0;
  const report = await run(
    async (input) => {
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      calls.push(input);
      await Promise.resolve();
      active -= 1;
      const evalCase = caseForInput(input);
      return success(evalCase.expectedDecision);
    },
    { repetitions: 3, clock: deterministicClock(Array.from({ length: 72 }, (_, i) => i * 10)) },
  );

  assert.equal(maximumActive, 1);
  assert.equal(calls.length, 36);
  assert.deepEqual(
    report.results.map((result) => `${result.caseId}:${result.runNumber}`),
    professorContextToolSelectionCases.flatMap((evalCase) => [1, 2, 3].map(
      (runNumber) => `${evalCase.id}:${runNumber}`,
    )),
  );
  assert.equal(calls.every((call) => call.prompt === prompt), true);
});

test("cada categoria recebe somente o contexto interno correspondente", async () => {
  const observed: Array<{ id: string; type: string; frozen: boolean }> = [];
  await run(async (input) => {
    const evalCase = caseForInput(input);
    observed.push({
      id: evalCase.id,
      type: input.authorizedContext.type,
      frozen: Object.isFrozen(input.authorizedContext),
    });
    return success(evalCase.expectedDecision);
  });
  assert.deepEqual(
    observed.map((item) => item.type),
    professorContextToolSelectionCases.map(
      (evalCase) => evalCase.authorizedContextType,
    ),
  );
  assert.equal(observed.every((item) => item.frozen), true);
});

test("classifica correct, false_positive, false_negative e wrong_tool", async () => {
  const actual = [
    "get_game_context",
    "not_called",
    "get_position_context",
    "get_game_context",
    "get_position_context",
    "not_called",
    "get_game_context",
    "get_position_context",
    "get_game_context",
    "not_called",
    "not_called",
    "get_position_context",
  ] as const;
  let index = 0;
  const report = await run(async () => success(actual[index++]));
  assert.deepEqual(
    report.results.map((result) => result.classification),
    [
      "correct",
      "false_negative",
      "wrong_tool",
      "correct",
      "correct",
      "false_negative",
      "wrong_tool",
      "correct",
      "false_positive",
      "correct",
      "correct",
      "false_positive",
    ],
  );
  assert.deepEqual(
    {
      correct: report.correct,
      falsePositives: report.falsePositives,
      falseNegatives: report.falseNegatives,
      wrongTools: report.wrongTools,
    },
    { correct: 6, falsePositives: 2, falseNegatives: 2, wrongTools: 2 },
  );
});

test("technical_error preserva somente código sanitizado e não interrompe", async () => {
  let index = 0;
  const report = await run(async () => {
    index += 1;
    if (index === 2) {
      return {
        status: "technical_error",
        errorCode: "TOOL_CONTEXT_MISMATCH",
        telemetry: {
          firstInteractionLatencyMs: 2,
          finalInteractionLatencyMs: null,
          tokens: null,
        },
      };
    }
    if (index === 3) throw new Error("sk-secret stack FEN privado");
    return success(professorContextToolSelectionCases[index - 1].expectedDecision);
  });
  assert.equal(report.results.length, 12);
  assert.equal(report.results[1].classification, "technical_error");
  assert.equal(report.results[1].errorCode, "TOOL_CONTEXT_MISMATCH");
  assert.equal(report.results[2].errorCode, "UNEXPECTED_ERROR");
  assert.equal(report.results[3].classification, "correct");
  assert.equal(JSON.stringify(report).includes("sk-secret"), false);
});

test("métricas distinguem decision accuracy, sucesso ponta a ponta e completion", async () => {
  let index = 0;
  const report = await run(async () => {
    index += 1;
    if (index <= 2) {
      return {
        status: "technical_error",
        errorCode: "PROVIDER_ERROR",
        telemetry: {
          firstInteractionLatencyMs: null,
          finalInteractionLatencyMs: null,
          tokens: null,
        },
      };
    }
    if (index === 3) return success("not_called");
    return success(professorContextToolSelectionCases[index - 1].expectedDecision);
  });
  assert.equal(report.technicalErrors, 2);
  assert.equal(report.correct, 9);
  assert.equal(report.decisionAccuracy, 9 / 10);
  assert.equal(report.endToEndSuccessRate, 9 / 12);
  assert.equal(report.completionRate, 10 / 12);
  assert.equal(report.metricsByExpectedDecision.get_game_context.totalRuns, 4);
});

test("todos os erros técnicos produzem decisionAccuracy null e zero sucesso", async () => {
  const report = await run(async () => ({
    status: "technical_error",
    errorCode: "PROVIDER_ERROR",
    telemetry: {
      firstInteractionLatencyMs: null,
      finalInteractionLatencyMs: null,
      tokens: null,
    },
  }));
  assert.equal(report.technicalErrors, 12);
  assert.equal(report.decisionAccuracy, null);
  assert.equal(report.endToEndSuccessRate, 0);
  assert.equal(report.completionRate, 0);
  assert.equal(
    report.metricsByExpectedDecision.get_game_context.accuracy,
    null,
  );
});

test("matriz de confusão 3x3 conta somente decisões públicas válidas", async () => {
  const report = await run(async (input) => {
    const evalCase = caseForInput(input);
    return success(evalCase.expectedDecision);
  });
  assert.deepEqual(report.confusionMatrix, {
    get_game_context: {
      get_game_context: 4,
      get_position_context: 0,
      not_called: 0,
    },
    get_position_context: {
      get_game_context: 0,
      get_position_context: 4,
      not_called: 0,
    },
    not_called: {
      get_game_context: 0,
      get_position_context: 0,
      not_called: 4,
    },
  });
});

test("latências total, mínima, máxima, média e mediana são calculadas sem negativos", async () => {
  const values = Array.from({ length: 24 }, (_, index) => {
    const run = Math.floor(index / 2);
    return index % 2 === 0 ? run * 100 : run * 100 + run + 1;
  });
  const report = await run(
    async (input) => {
      const evalCase = caseForInput(input);
      return success(evalCase.expectedDecision, {
        firstInteractionLatencyMs: 0.25,
        finalInteractionLatencyMs: 0.25,
        tokens: null,
      });
    },
    { clock: deterministicClock(values) },
  );
  assert.equal(report.results.every((result) => result.totalLatencyMs >= 0), true);
  assert.equal(report.latency.sampleCount, 12);
  assert.equal(report.latency.minimumMs, 1);
  assert.equal(report.latency.maximumMs, 12);
  assert.equal(report.latency.averageMs, 6.5);
  assert.equal(report.latency.medianMs, 6.5);
});

test("latência incompatível vira technical_error validado", async () => {
  const report = await run(async (input) => {
    const evalCase = caseForInput(input);
    return success(evalCase.expectedDecision, {
      firstInteractionLatencyMs: 8,
      finalInteractionLatencyMs: 8,
      tokens: null,
    });
  });
  assert.equal(report.technicalErrors, 12);
  assert.equal(
    report.results.every((result) => result.errorCode === "FLOW_RESULT_INVALID"),
    true,
  );
});

test("tokens somam as duas interações e usage ausente permanece null", async () => {
  assert.deepEqual(
    combineProfessorContextToolSelectionUsages(
      { input_tokens: 10, output_tokens: 4, total_tokens: 14 },
      { input_tokens: 7, output_tokens: 9, total_tokens: 16 },
    ),
    { inputTokens: 17, outputTokens: 13, totalTokens: 30 },
  );
  assert.equal(
    combineProfessorContextToolSelectionUsages(
      { input_tokens: 10, output_tokens: 4, total_tokens: 14 },
      null,
    ),
    null,
  );

  let index = 0;
  const report = await run(async (input) => {
    const evalCase = caseForInput(input);
    index += 1;
    return success(evalCase.expectedDecision, {
      firstInteractionLatencyMs: 2,
      finalInteractionLatencyMs: 3,
      tokens:
        index === 1
          ? { inputTokens: 17, outputTokens: 13, totalTokens: 30 }
          : null,
    });
  });
  assert.deepEqual(report.tokens, {
    sampleCount: 1,
    inputTokens: 17,
    outputTokens: 13,
    totalTokens: 30,
  });
  assert.equal(report.results[1].tokens, null);
});

test("schemas rejeitam latência negativa, tokens incoerentes e propriedades extras", () => {
  const base = {
    caseId: "GAME-SEL-001",
    runNumber: 1,
    expectedDecision: "get_game_context",
    actualDecision: "get_game_context",
    classification: "correct",
    totalLatencyMs: 5,
    firstInteractionLatencyMs: 2,
    finalInteractionLatencyMs: 3,
    toolCallCount: 1,
    evidenceStatus: "partial",
    tokens: { inputTokens: 3, outputTokens: 2, totalTokens: 5 },
    errorCode: null,
  } as const;
  for (const value of [
    { ...base, totalLatencyMs: -1 },
    { ...base, tokens: { inputTokens: 3, outputTokens: 2, totalTokens: 4 } },
    { ...base, extra: "snapshot" },
  ]) {
    assert.equal(
      professorContextToolSelectionEvalRunResultSchema.safeParse(value).success,
      false,
    );
  }
});

test("schema do relatório rejeita adulterações semânticas isoladas", async (t) => {
  const validReport = await run(
    async (input) => {
      const evalCase = caseForInput(input);
      return success(evalCase.expectedDecision);
    },
    {
      repetitions: 2,
      clock: deterministicClock(
        Array.from({ length: 48 }, (_, index) => index * 10),
      ),
    },
  );

  const scenarios: Array<{
    name: string;
    alter: (report: ProfessorContextToolSelectionEvalReport) => void;
  }> = [
    {
      name: "célula da matriz de confusão",
      alter: (report) => {
        report.confusionMatrix.get_game_context.get_game_context += 1;
      },
    },
    {
      name: "accuracy de uma classe",
      alter: (report) => {
        report.metricsByExpectedDecision.get_game_context.accuracy = 0;
      },
    },
    {
      name: "totalRuns de uma classe",
      alter: (report) => {
        report.metricsByExpectedDecision.get_game_context.totalRuns += 1;
      },
    },
    {
      name: "sampleCount de latência",
      alter: (report) => {
        report.latency.sampleCount -= 1;
      },
    },
    {
      name: "mediana",
      alter: (report) => {
        assert.notEqual(report.latency.medianMs, null);
        report.latency.medianMs = report.latency.medianMs! + 1;
      },
    },
    {
      name: "sampleCount de tokens",
      alter: (report) => {
        report.tokens.sampleCount -= 1;
      },
    },
    {
      name: "soma de tokens",
      alter: (report) => {
        assert.notEqual(report.tokens.inputTokens, null);
        report.tokens.inputTokens = report.tokens.inputTokens! + 1;
        assert.notEqual(report.tokens.totalTokens, null);
        report.tokens.totalTokens = report.tokens.totalTokens! + 1;
      },
    },
    {
      name: "expectedDecision de um resultado",
      alter: (report) => {
        report.results[0].expectedDecision = "get_position_context";
      },
    },
    {
      name: "runNumber duplicado",
      alter: (report) => {
        report.results[1].runNumber = report.results[0].runNumber;
      },
    },
    {
      name: "ordem de dois resultados",
      alter: (report) => {
        [report.results[0], report.results[1]] = [
          report.results[1],
          report.results[0],
        ];
      },
    },
    {
      name: "completedAt anterior a startedAt",
      alter: (report) => {
        report.completedAt = "2026-07-16T11:59:59.000Z";
      },
    },
  ];

  for (const scenario of scenarios) {
    await t.test(scenario.name, () => {
      const altered = cloneReport(validReport);
      scenario.alter(altered);
      assert.equal(
        professorContextToolSelectionEvalReportSchema.safeParse(altered)
          .success,
        false,
      );
    });
  }
});

test("relatório sanitizado exclui mensagens, snapshots, IDs internos e output textual", async () => {
  const report = await run(async (input) => {
    const evalCase = caseForInput(input);
    return success(evalCase.expectedDecision);
  });
  assert.equal(
    professorContextToolSelectionEvalReportSchema.safeParse(report).success,
    true,
  );
  const serialized = JSON.stringify(report);
  for (const forbidden of [
    professorContextToolSelectionCases[0].message,
    "snapshot",
    "r3k2r",
    "TeaChess Synthetic Eval",
    "Oponente Sintético",
    "Nota fictícia",
    "sintetico",
    "synthetic-eval-owner",
    "professor-eval-game-01",
    "professor-eval-position-01",
    "Texto que não deve ser persistido",
    "call_id",
    "arguments",
    "systemPrompt",
    "stack",
    "cause",
    "sk-",
  ]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
});

test("uma repetição produz 12 runs e três repetições produzem 36", async () => {
  const executor: ProfessorContextToolSelectionEvalExecutor = async (input) => {
    const evalCase = caseForInput(input);
    return success(evalCase.expectedDecision);
  };
  assert.equal((await run(executor)).totalRuns, 12);
  assert.equal(
    (
      await run(executor, {
        repetitions: 3,
        clock: deterministicClock(Array.from({ length: 72 }, (_, i) => i * 10)),
      })
    ).totalRuns,
    36,
  );
});
