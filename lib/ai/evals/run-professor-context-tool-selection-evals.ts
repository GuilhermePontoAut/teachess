import { z } from "zod";
import type { ResponseUsage } from "openai/resources/responses/responses";
import type { SelectedProfessorIaPrompt } from "../prompts/professor-ia-prompts";
import { PROVISIONAL_TEACHER_RESPONSE_SCHEMA_VERSION } from "../schemas/provisional-teacher-response";
import {
  getProfessorContextToolFlowObservedToolName,
  ProfessorContextToolFlowError,
} from "../tools/professor-context-tool-flow";
import {
  authorizedProfessorContextSchema,
  PROFESSOR_CONTEXT_TOOL_FLOW_MODEL,
  professorContextToolFlowResultSchema,
  type AuthorizedProfessorContext,
  type ProfessorContextToolFlowResult,
} from "../tools/professor-context-tool-flow.schemas";
import { authorizedGameSnapshotSchema } from "../tools/get-game-context.schemas";
import { authorizedPositionSnapshotSchema } from "../tools/get-position-context.schemas";
import {
  PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_SET_VERSION,
  professorContextToolSelectionEvalCasesSchema,
  professorContextToolSelectionCases,
  type ProfessorContextToolSelectionEvalCase,
} from "./professor-context-tool-selection-cases";

export const PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_RUNNER_VERSION =
  "professor-context-tool-selection-runner-v1" as const;
export const PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_MAX_REPETITIONS = 5;
export const INVALID_PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_CASE_SET =
  "INVALID_EVAL_CASE_SET" as const;
export const PROFESSOR_CONTEXT_TOOL_SELECTION_LATENCY_TOLERANCE_MS = 1;

export class InvalidProfessorContextToolSelectionEvalCaseSetError extends Error {
  readonly code = INVALID_PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_CASE_SET;

  constructor() {
    super("O conjunto canônico de casos de avaliação é inválido.");
    this.name = "InvalidProfessorContextToolSelectionEvalCaseSetError";
  }
}

const decisionSchema = z.enum([
  "get_game_context",
  "get_position_context",
  "not_called",
]);
const classificationSchema = z.enum([
  "correct",
  "false_positive",
  "false_negative",
  "wrong_tool",
  "technical_error",
]);
const sanitizedErrorCodeSchema = z
  .string()
  .regex(/^[A-Z][A-Z0-9_]{0,63}$/);
const nonnegativeIntegerSchema = z.number().int().nonnegative();
const latencySchema = z.number().finite().nonnegative();

export type ProfessorContextToolSelectionDecision = z.infer<
  typeof decisionSchema
>;
export type ProfessorContextToolSelectionClassification = z.infer<
  typeof classificationSchema
>;

export const professorContextToolSelectionTokensSchema = z
  .object({
    inputTokens: nonnegativeIntegerSchema,
    outputTokens: nonnegativeIntegerSchema,
    totalTokens: nonnegativeIntegerSchema,
  })
  .strict()
  .superRefine((tokens, context) => {
    if (tokens.totalTokens !== tokens.inputTokens + tokens.outputTokens) {
      context.addIssue({
        code: "custom",
        path: ["totalTokens"],
        message: "totalTokens deve ser a soma de inputTokens e outputTokens.",
      });
    }
  });

export type ProfessorContextToolSelectionTokens = z.infer<
  typeof professorContextToolSelectionTokensSchema
>;

export const professorContextToolSelectionTelemetrySchema = z
  .object({
    firstInteractionLatencyMs: latencySchema.nullable(),
    finalInteractionLatencyMs: latencySchema.nullable(),
    tokens: professorContextToolSelectionTokensSchema.nullable(),
  })
  .strict();

export type ProfessorContextToolSelectionTelemetry = z.infer<
  typeof professorContextToolSelectionTelemetrySchema
>;

export const professorContextToolSelectionEvalRunConfigSchema = z
  .object({
    model: z.literal(PROFESSOR_CONTEXT_TOOL_FLOW_MODEL),
    promptVersion: z.literal("professor-ia-v2"),
    schemaVersion: z.literal(PROVISIONAL_TEACHER_RESPONSE_SCHEMA_VERSION),
    evalSetVersion: z.literal(
      PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_SET_VERSION,
    ),
    repetitions: z
      .number()
      .int()
      .min(1)
      .max(PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_MAX_REPETITIONS),
  })
  .strict();

export type ProfessorContextToolSelectionEvalRunConfig = z.infer<
  typeof professorContextToolSelectionEvalRunConfigSchema
>;

function classifyDecision(
  expectedDecision: ProfessorContextToolSelectionDecision,
  actualDecision: ProfessorContextToolSelectionDecision,
): Exclude<ProfessorContextToolSelectionClassification, "technical_error"> {
  if (expectedDecision === actualDecision) return "correct";
  if (expectedDecision === "not_called") return "false_positive";
  if (actualDecision === "not_called") return "false_negative";
  return "wrong_tool";
}

export const professorContextToolSelectionEvalRunResultSchema = z
  .object({
    caseId: z.string().regex(/^(?:GAME|POSITION|NO-TOOL)-SEL-00[1-4]$/),
    runNumber: z
      .number()
      .int()
      .min(1)
      .max(PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_MAX_REPETITIONS),
    expectedDecision: decisionSchema,
    actualDecision: decisionSchema.nullable(),
    classification: classificationSchema,
    totalLatencyMs: latencySchema,
    firstInteractionLatencyMs: latencySchema.nullable(),
    finalInteractionLatencyMs: latencySchema.nullable(),
    toolCallCount: z.union([z.literal(0), z.literal(1)]).nullable(),
    evidenceStatus: z
      .enum(["sufficient", "partial", "insufficient"])
      .nullable(),
    tokens: professorContextToolSelectionTokensSchema.nullable(),
    errorCode: sanitizedErrorCodeSchema.nullable(),
  })
  .strict()
  .superRefine((result, context) => {
    const issue = (path: PropertyKey[], message: string) =>
      context.addIssue({ code: "custom", path, message });

    const hasFirstLatency = result.firstInteractionLatencyMs !== null;
    const hasFinalLatency = result.finalInteractionLatencyMs !== null;
    if (
      result.firstInteractionLatencyMs !== null &&
      result.finalInteractionLatencyMs !== null &&
      result.totalLatencyMs +
        PROFESSOR_CONTEXT_TOOL_SELECTION_LATENCY_TOLERANCE_MS <
        result.firstInteractionLatencyMs + result.finalInteractionLatencyMs
    ) {
      issue(
        ["totalLatencyMs"],
        "A latência total deve comportar aproximadamente as duas interações.",
      );
    }

    if (result.classification === "technical_error") {
      if (result.actualDecision !== null) {
        issue(["actualDecision"], "Erro técnico não contém decisão pública.");
      }
      if (result.toolCallCount !== null) {
        issue(["toolCallCount"], "Erro técnico não contém call count confiável.");
      }
      if (result.evidenceStatus !== null) {
        issue(["evidenceStatus"], "Erro técnico não contém evidenceStatus.");
      }
      if (result.errorCode === null) {
        issue(["errorCode"], "Erro técnico exige código sanitizado.");
      }
      return;
    }

    const isBlockedWrongToolObservation =
      result.classification === "wrong_tool" &&
      result.actualDecision !== null &&
      result.actualDecision !== "not_called" &&
      result.actualDecision !== result.expectedDecision &&
      result.toolCallCount === 1 &&
      result.evidenceStatus === null &&
      result.finalInteractionLatencyMs === null &&
      result.errorCode === null;
    if (isBlockedWrongToolObservation) {
      if (!hasFirstLatency) {
        issue(
          ["firstInteractionLatencyMs"],
          "Uma Tool incompatível observada exige a latência da primeira interação.",
        );
      }
      return;
    }

    if (result.actualDecision === null) {
      issue(["actualDecision"], "Execução válida exige decisão pública.");
      return;
    }
    if (result.errorCode !== null) {
      issue(["errorCode"], "Execução válida não pode conter erro.");
    }
    if (result.evidenceStatus === null) {
      issue(["evidenceStatus"], "Execução válida exige evidenceStatus.");
    }
    if (!hasFirstLatency || !hasFinalLatency) {
      issue(
        ["firstInteractionLatencyMs"],
        "Execução válida exige latência das duas interações.",
      );
    }
    const expectedCallCount =
      result.actualDecision === "not_called" ? 0 : 1;
    if (result.toolCallCount !== expectedCallCount) {
      issue(["toolCallCount"], "Call count deve corresponder à decisão.");
    }
    if (
      result.classification !==
      classifyDecision(result.expectedDecision, result.actualDecision)
    ) {
      issue(
        ["classification"],
        "Classificação deve corresponder às decisões esperada e observada.",
      );
    }
  });

export type ProfessorContextToolSelectionEvalRunResult = z.infer<
  typeof professorContextToolSelectionEvalRunResultSchema
>;

const confusionRowSchema = z
  .object({
    get_game_context: nonnegativeIntegerSchema,
    get_position_context: nonnegativeIntegerSchema,
    not_called: nonnegativeIntegerSchema,
  })
  .strict();

export const professorContextToolSelectionConfusionMatrixSchema = z
  .object({
    get_game_context: confusionRowSchema,
    get_position_context: confusionRowSchema,
    not_called: confusionRowSchema,
  })
  .strict();

const perDecisionMetricSchema = z
  .object({
    totalRuns: nonnegativeIntegerSchema,
    validDecisions: nonnegativeIntegerSchema,
    correct: nonnegativeIntegerSchema,
    technicalErrors: nonnegativeIntegerSchema,
    accuracy: z.number().min(0).max(1).nullable(),
  })
  .strict()
  .superRefine((metric, context) => {
    if (metric.validDecisions !== metric.totalRuns - metric.technicalErrors) {
      context.addIssue({
        code: "custom",
        path: ["validDecisions"],
        message: "validDecisions deve excluir erros técnicos.",
      });
    }
    const expectedAccuracy =
      metric.validDecisions === 0 ? null : metric.correct / metric.validDecisions;
    if (metric.accuracy !== expectedAccuracy) {
      context.addIssue({
        code: "custom",
        path: ["accuracy"],
        message: "Accuracy por decisão está inconsistente.",
      });
    }
  });

const latencyMetricsSchema = z
  .object({
    sampleCount: nonnegativeIntegerSchema,
    minimumMs: latencySchema.nullable(),
    maximumMs: latencySchema.nullable(),
    averageMs: latencySchema.nullable(),
    medianMs: latencySchema.nullable(),
  })
  .strict()
  .superRefine((metrics, context) => {
    const values = [
      metrics.minimumMs,
      metrics.maximumMs,
      metrics.averageMs,
      metrics.medianMs,
    ];
    const shouldBeNull = metrics.sampleCount === 0;
    if (values.some((value) => (shouldBeNull ? value !== null : value === null))) {
      context.addIssue({
        code: "custom",
        path: ["sampleCount"],
        message: "Estatísticas de latência devem acompanhar o denominador.",
      });
    }
  });

const tokenMetricsSchema = z
  .object({
    sampleCount: nonnegativeIntegerSchema,
    inputTokens: nonnegativeIntegerSchema.nullable(),
    outputTokens: nonnegativeIntegerSchema.nullable(),
    totalTokens: nonnegativeIntegerSchema.nullable(),
  })
  .strict()
  .superRefine((metrics, context) => {
    const values = [metrics.inputTokens, metrics.outputTokens, metrics.totalTokens];
    const shouldBeNull = metrics.sampleCount === 0;
    if (values.some((value) => (shouldBeNull ? value !== null : value === null))) {
      context.addIssue({
        code: "custom",
        path: ["sampleCount"],
        message: "Somas de tokens devem acompanhar o denominador.",
      });
    }
    if (
      metrics.inputTokens !== null &&
      metrics.outputTokens !== null &&
      metrics.totalTokens !== metrics.inputTokens + metrics.outputTokens
    ) {
      context.addIssue({
        code: "custom",
        path: ["totalTokens"],
        message: "A soma consolidada de tokens está inconsistente.",
      });
    }
  });

export const professorContextToolSelectionEvalReportSchema = z
  .object({
    runnerVersion: z.literal(
      PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_RUNNER_VERSION,
    ),
    model: z.literal(PROFESSOR_CONTEXT_TOOL_FLOW_MODEL),
    promptVersion: z.literal("professor-ia-v2"),
    schemaVersion: z.literal(PROVISIONAL_TEACHER_RESPONSE_SCHEMA_VERSION),
    evalSetVersion: z.literal(
      PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_SET_VERSION,
    ),
    repetitions: z
      .number()
      .int()
      .min(1)
      .max(PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_MAX_REPETITIONS),
    startedAt: z.iso.datetime(),
    completedAt: z.iso.datetime(),
    totalRuns: nonnegativeIntegerSchema,
    correct: nonnegativeIntegerSchema,
    falsePositives: nonnegativeIntegerSchema,
    falseNegatives: nonnegativeIntegerSchema,
    wrongTools: nonnegativeIntegerSchema,
    technicalErrors: nonnegativeIntegerSchema,
    decisionAccuracy: z.number().min(0).max(1).nullable(),
    endToEndSuccessRate: z.number().min(0).max(1),
    completionRate: z.number().min(0).max(1),
    confusionMatrix: professorContextToolSelectionConfusionMatrixSchema,
    metricsByExpectedDecision: z
      .object({
        get_game_context: perDecisionMetricSchema,
        get_position_context: perDecisionMetricSchema,
        not_called: perDecisionMetricSchema,
      })
      .strict(),
    latency: latencyMetricsSchema,
    tokens: tokenMetricsSchema,
    results: z.array(professorContextToolSelectionEvalRunResultSchema),
  })
  .strict()
  .superRefine((report, context) => {
    const issue = (path: PropertyKey[], message: string) =>
      context.addIssue({ code: "custom", path, message });
    const count = (classification: ProfessorContextToolSelectionClassification) =>
      report.results.filter((result) => result.classification === classification)
        .length;
    const expectedCounts = {
      correct: count("correct"),
      falsePositives: count("false_positive"),
      falseNegatives: count("false_negative"),
      wrongTools: count("wrong_tool"),
      technicalErrors: count("technical_error"),
    };

    if (
      report.totalRuns !== report.results.length ||
      report.totalRuns !== 12 * report.repetitions
    ) {
      context.addIssue({
        code: "custom",
        path: ["totalRuns"],
        message: "totalRuns deve ser doze casos vezes repetitions.",
      });
    }
    for (const [field, expected] of Object.entries(expectedCounts)) {
      if (report[field as keyof typeof expectedCounts] !== expected) {
        context.addIssue({
          code: "custom",
          path: [field],
          message: "Contador consolidado está inconsistente.",
        });
      }
    }

    const validDecisions = report.totalRuns - report.technicalErrors;
    const expectedDecisionAccuracy =
      validDecisions === 0 ? null : report.correct / validDecisions;
    if (report.decisionAccuracy !== expectedDecisionAccuracy) {
      context.addIssue({
        code: "custom",
        path: ["decisionAccuracy"],
        message: "decisionAccuracy deve excluir erros técnicos.",
      });
    }
    const expectedEndToEnd =
      report.totalRuns === 0 ? 0 : report.correct / report.totalRuns;
    const expectedCompletion =
      report.totalRuns === 0 ? 0 : validDecisions / report.totalRuns;
    if (report.endToEndSuccessRate !== expectedEndToEnd) {
      context.addIssue({
        code: "custom",
        path: ["endToEndSuccessRate"],
        message: "endToEndSuccessRate deve incluir erros técnicos.",
      });
    }
    if (report.completionRate !== expectedCompletion) {
      issue(["completionRate"], "completionRate está inconsistente.");
    }

    if (new Date(report.completedAt) < new Date(report.startedAt)) {
      issue(["completedAt"], "A ordem temporal do relatório é inválida.");
    }

    const expectedResultOrder = professorContextToolSelectionCases.flatMap(
      (evalCase) =>
        Array.from({ length: report.repetitions }, (_, index) => ({
          caseId: evalCase.id,
          runNumber: index + 1,
          expectedDecision: evalCase.expectedDecision,
        })),
    );
    const uniqueRuns = new Set(
      report.results.map((result) => `${result.caseId}:${result.runNumber}`),
    );
    if (uniqueRuns.size !== report.results.length) {
      issue(["results"], "A identidade das execuções é inválida.");
    }
    const hasCanonicalResults =
      report.results.length === expectedResultOrder.length &&
      report.results.every((result, index) => {
        const expected = expectedResultOrder[index];
        return (
          expected !== undefined &&
          result.caseId === expected.caseId &&
          result.runNumber === expected.runNumber &&
          result.expectedDecision === expected.expectedDecision
        );
      });
    if (!hasCanonicalResults) {
      issue(["results"], "A sequência canônica das execuções é inválida.");
    }

    const expectedConfusionMatrix = emptyConfusionMatrix();
    for (const result of report.results) {
      if (result.actualDecision !== null) {
        expectedConfusionMatrix[result.expectedDecision][result.actualDecision] +=
          1;
      }
    }
    for (const expectedDecision of decisionSchema.options) {
      for (const actualDecision of decisionSchema.options) {
        if (
          report.confusionMatrix[expectedDecision][actualDecision] !==
          expectedConfusionMatrix[expectedDecision][actualDecision]
        ) {
          issue(
            ["confusionMatrix"],
            "A matriz de confusão está inconsistente.",
          );
        }
      }
    }

    const expectedMetrics = buildMetricsByExpectedDecision(report.results);
    for (const decision of decisionSchema.options) {
      const received = report.metricsByExpectedDecision[decision];
      const expected = expectedMetrics[decision];
      if (
        received.totalRuns !== expected.totalRuns ||
        received.validDecisions !== expected.validDecisions ||
        received.correct !== expected.correct ||
        received.technicalErrors !== expected.technicalErrors ||
        received.accuracy !== expected.accuracy
      ) {
        issue(
          ["metricsByExpectedDecision", decision],
          "As métricas por decisão estão inconsistentes.",
        );
      }
    }

    const expectedLatency = buildLatencyMetrics(report.results);
    if (
      report.latency.sampleCount !== expectedLatency.sampleCount ||
      report.latency.minimumMs !== expectedLatency.minimumMs ||
      report.latency.maximumMs !== expectedLatency.maximumMs ||
      report.latency.averageMs !== expectedLatency.averageMs ||
      report.latency.medianMs !== expectedLatency.medianMs
    ) {
      issue(["latency"], "As métricas de latência estão inconsistentes.");
    }

    const expectedTokens = buildTokenMetrics(report.results);
    if (
      report.tokens.sampleCount !== expectedTokens.sampleCount ||
      report.tokens.inputTokens !== expectedTokens.inputTokens ||
      report.tokens.outputTokens !== expectedTokens.outputTokens ||
      report.tokens.totalTokens !== expectedTokens.totalTokens
    ) {
      issue(["tokens"], "As métricas de tokens estão inconsistentes.");
    }
  });

export type ProfessorContextToolSelectionEvalReport = z.infer<
  typeof professorContextToolSelectionEvalReportSchema
>;

const rawGameFixture = {
  gameContextId: "professor-eval-game-01",
  origin: "platform",
  visibility: "public",
  ownerUserId: "synthetic-eval-owner",
  requestingUserId: "synthetic-eval-owner",
  result: "win",
  playerColor: "white",
  date: "2026-06-15",
  opponent: "Oponente Sintético",
  playerRatingAtGame: 1500,
  opponentRatingAtGame: 1510,
  opening: "Abertura Italiana — fixture sintética",
  recordedMoveCount: 6,
  pgn: "[Event \"TeaChess Synthetic Eval\"]\n[White \"Synthetic A\"]\n[Black \"Synthetic B\"]\n[Result \"1-0\"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 1-0",
  notes: "Nota fictícia criada somente para a fixture de avaliação.",
  tags: ["sintetico", "eval"],
  analysisStatus: "not_analyzed",
  dataNature: "simulated_demo",
} as const;

const rawPositionFixture = {
  positionContextId: "professor-eval-position-01",
  fen: "r3k2r/pppq1ppp/2npbn2/3Np3/2B1P3/2N2Q1P/PPP2PP1/R3K2R w KQkq - 2 10",
  imageOrigin: "online_game_screenshot",
  sourceContext: "personal_study",
  recognitionStatus: "demo_available",
  dataNature: "simulated_demo",
  confirmationStatus: "confirmed",
} as const;

function deepFreeze<T>(value: T): T {
  if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
    for (const nestedValue of Object.values(value as Record<string, unknown>)) {
      deepFreeze(nestedValue);
    }
    Object.freeze(value);
  }
  return value;
}

export function createProfessorContextToolSelectionEvalFixtures() {
  const game = authorizedGameSnapshotSchema.parse(rawGameFixture);
  const position = authorizedPositionSnapshotSchema.parse(rawPositionFixture);
  const none = authorizedProfessorContextSchema.parse({ type: "none" });

  return deepFreeze({
    game: authorizedProfessorContextSchema.parse({ type: "game", snapshot: game }),
    position: authorizedProfessorContextSchema.parse({
      type: "position",
      snapshot: position,
    }),
    none,
  });
}

function sameStringArray(received: readonly string[], canonical: readonly string[]) {
  return (
    received.length === canonical.length &&
    received.every((value, index) => value === canonical[index])
  );
}

export function validateProfessorContextToolSelectionEvalCaseSet(
  cases: readonly unknown[],
): readonly ProfessorContextToolSelectionEvalCase[] {
  const parsed = professorContextToolSelectionEvalCasesSchema.safeParse(cases);
  if (!parsed.success) {
    throw new InvalidProfessorContextToolSelectionEvalCaseSetError();
  }
  const hasUniqueIds =
    new Set(parsed.data.map((evalCase) => evalCase.id)).size === parsed.data.length;
  const matchesCanonical = parsed.data.every((evalCase, index) => {
    const canonical = professorContextToolSelectionCases[index];
    return (
      canonical !== undefined &&
      evalCase.id === canonical.id &&
      evalCase.category === canonical.category &&
      evalCase.message === canonical.message &&
      evalCase.authorizedContextType === canonical.authorizedContextType &&
      evalCase.expectedDecision === canonical.expectedDecision &&
      evalCase.rationale === canonical.rationale &&
      evalCase.status === canonical.status &&
      sameStringArray(evalCase.prohibitedBehaviors, canonical.prohibitedBehaviors)
    );
  });
  if (!hasUniqueIds || !matchesCanonical) {
    throw new InvalidProfessorContextToolSelectionEvalCaseSetError();
  }
  return parsed.data;
}

export type ProfessorContextToolSelectionEvalExecutionOutcome =
  | {
      status: "success";
      flowResult: ProfessorContextToolFlowResult;
      telemetry: ProfessorContextToolSelectionTelemetry;
    }
  | {
      status: "wrong_tool";
      actualDecision: Exclude<
        ProfessorContextToolSelectionDecision,
        "not_called"
      >;
      telemetry: ProfessorContextToolSelectionTelemetry;
    }
  | {
      status: "technical_error";
      errorCode: string;
      telemetry: ProfessorContextToolSelectionTelemetry;
    };

export type ProfessorContextToolSelectionEvalExecutorInput = {
  message: string;
  authorizedContext: AuthorizedProfessorContext;
  prompt: SelectedProfessorIaPrompt;
};

export type ProfessorContextToolSelectionEvalExecutor = (
  input: ProfessorContextToolSelectionEvalExecutorInput,
) => Promise<ProfessorContextToolSelectionEvalExecutionOutcome>;

export type ProfessorContextToolSelectionEvalRunnerClock = {
  now: () => Date;
  monotonicNow: () => number;
};

export type RunProfessorContextToolSelectionEvalsInput = {
  cases: readonly unknown[];
  config: ProfessorContextToolSelectionEvalRunConfig;
  prompt: SelectedProfessorIaPrompt;
  executeCase: ProfessorContextToolSelectionEvalExecutor;
  clock?: ProfessorContextToolSelectionEvalRunnerClock;
};

const defaultClock: ProfessorContextToolSelectionEvalRunnerClock = {
  now: () => new Date(),
  monotonicNow: () => performance.now(),
};

function normalizeDecision(
  flowResult: ProfessorContextToolFlowResult,
): ProfessorContextToolSelectionDecision {
  if (flowResult.toolDecision.status === "not_called") return "not_called";
  return flowResult.toolDecision.name;
}

export function getProfessorContextToolSelectionSanitizedErrorCode(
  error: unknown,
): string {
  if (error instanceof ProfessorContextToolFlowError) return error.code;
  if (error instanceof z.ZodError) return "FLOW_RESULT_INVALID";
  return "UNEXPECTED_ERROR";
}

export function getProfessorContextToolSelectionObservedWrongTool(
  error: unknown,
): Exclude<ProfessorContextToolSelectionDecision, "not_called"> | null {
  if (
    !(error instanceof ProfessorContextToolFlowError) ||
    error.code !== "TOOL_CONTEXT_MISMATCH"
  ) {
    return null;
  }
  return getProfessorContextToolFlowObservedToolName(error);
}

function authorizedContextForCase(
  evalCase: ProfessorContextToolSelectionEvalCase,
  fixtures: ReturnType<typeof createProfessorContextToolSelectionEvalFixtures>,
): AuthorizedProfessorContext {
  return fixtures[evalCase.authorizedContextType];
}

function emptyConfusionMatrix() {
  return {
    get_game_context: {
      get_game_context: 0,
      get_position_context: 0,
      not_called: 0,
    },
    get_position_context: {
      get_game_context: 0,
      get_position_context: 0,
      not_called: 0,
    },
    not_called: {
      get_game_context: 0,
      get_position_context: 0,
      not_called: 0,
    },
  };
}

function buildMetricsByExpectedDecision(
  results: readonly ProfessorContextToolSelectionEvalRunResult[],
) {
  const decisions = decisionSchema.options;
  return Object.fromEntries(
    decisions.map((decision) => {
      const selected = results.filter(
        (result) => result.expectedDecision === decision,
      );
      const technicalErrors = selected.filter(
        (result) => result.classification === "technical_error",
      ).length;
      const validDecisions = selected.length - technicalErrors;
      const correct = selected.filter(
        (result) => result.classification === "correct",
      ).length;
      return [
        decision,
        {
          totalRuns: selected.length,
          validDecisions,
          correct,
          technicalErrors,
          accuracy: validDecisions === 0 ? null : correct / validDecisions,
        },
      ];
    }),
  ) as Record<
    ProfessorContextToolSelectionDecision,
    z.infer<typeof perDecisionMetricSchema>
  >;
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function buildLatencyMetrics(
  results: readonly ProfessorContextToolSelectionEvalRunResult[],
) {
  const values = results
    .filter(
      (result) =>
        result.firstInteractionLatencyMs !== null &&
        result.finalInteractionLatencyMs !== null,
    )
    .map((result) => result.totalLatencyMs);
  if (values.length === 0) {
    return {
      sampleCount: 0,
      minimumMs: null,
      maximumMs: null,
      averageMs: null,
      medianMs: null,
    };
  }
  return {
    sampleCount: values.length,
    minimumMs: Math.min(...values),
    maximumMs: Math.max(...values),
    averageMs: values.reduce((sum, value) => sum + value, 0) / values.length,
    medianMs: median(values),
  };
}

function buildTokenMetrics(
  results: readonly ProfessorContextToolSelectionEvalRunResult[],
) {
  const tokens = results.flatMap((result) =>
    result.tokens === null ? [] : [result.tokens],
  );
  if (tokens.length === 0) {
    return {
      sampleCount: 0,
      inputTokens: null,
      outputTokens: null,
      totalTokens: null,
    };
  }
  return {
    sampleCount: tokens.length,
    inputTokens: tokens.reduce((sum, item) => sum + item.inputTokens, 0),
    outputTokens: tokens.reduce((sum, item) => sum + item.outputTokens, 0),
    totalTokens: tokens.reduce((sum, item) => sum + item.totalTokens, 0),
  };
}

export function combineProfessorContextToolSelectionUsages(
  firstUsage: Pick<ResponseUsage, "input_tokens" | "output_tokens" | "total_tokens"> | null | undefined,
  finalUsage: Pick<ResponseUsage, "input_tokens" | "output_tokens" | "total_tokens"> | null | undefined,
): ProfessorContextToolSelectionTokens | null {
  if (firstUsage == null || finalUsage == null) return null;
  return professorContextToolSelectionTokensSchema.parse({
    inputTokens: firstUsage.input_tokens + finalUsage.input_tokens,
    outputTokens: firstUsage.output_tokens + finalUsage.output_tokens,
    totalTokens: firstUsage.total_tokens + finalUsage.total_tokens,
  });
}

export async function runProfessorContextToolSelectionEvals({
  cases,
  config,
  prompt,
  executeCase,
  clock = defaultClock,
}: RunProfessorContextToolSelectionEvalsInput): Promise<ProfessorContextToolSelectionEvalReport> {
  const canonicalCases = validateProfessorContextToolSelectionEvalCaseSet(cases);
  const parsedConfig = professorContextToolSelectionEvalRunConfigSchema.parse(config);
  if (prompt.version !== parsedConfig.promptVersion) {
    throw new Error("A versão do prompt não corresponde à configuração do eval.");
  }
  const fixtures = createProfessorContextToolSelectionEvalFixtures();
  const startedAt = clock.now().toISOString();
  const results: ProfessorContextToolSelectionEvalRunResult[] = [];

  for (const evalCase of canonicalCases) {
    for (
      let runNumber = 1;
      runNumber <= parsedConfig.repetitions;
      runNumber += 1
    ) {
      const start = clock.monotonicNow();
      let telemetry: ProfessorContextToolSelectionTelemetry = {
        firstInteractionLatencyMs: null,
        finalInteractionLatencyMs: null,
        tokens: null,
      };
      try {
        const outcome = await executeCase({
          message: evalCase.message,
          authorizedContext: authorizedContextForCase(evalCase, fixtures),
          prompt,
        });
        telemetry = professorContextToolSelectionTelemetrySchema.parse(
          outcome.telemetry,
        );
        const totalLatencyMs = Math.max(0, clock.monotonicNow() - start);

        if (outcome.status === "technical_error") {
          results.push(
            professorContextToolSelectionEvalRunResultSchema.parse({
              caseId: evalCase.id,
              runNumber,
              expectedDecision: evalCase.expectedDecision,
              actualDecision: null,
              classification: "technical_error",
              totalLatencyMs,
              ...telemetry,
              toolCallCount: null,
              evidenceStatus: null,
              errorCode: sanitizedErrorCodeSchema.parse(outcome.errorCode),
            }),
          );
          continue;
        }

        if (outcome.status === "wrong_tool") {
          results.push(
            professorContextToolSelectionEvalRunResultSchema.parse({
              caseId: evalCase.id,
              runNumber,
              expectedDecision: evalCase.expectedDecision,
              actualDecision: outcome.actualDecision,
              classification: "wrong_tool",
              totalLatencyMs,
              ...telemetry,
              toolCallCount: 1,
              evidenceStatus: null,
              errorCode: null,
            }),
          );
          continue;
        }

        const flowResult = professorContextToolFlowResultSchema.parse(
          outcome.flowResult,
        );
        const actualDecision = normalizeDecision(flowResult);
        results.push(
          professorContextToolSelectionEvalRunResultSchema.parse({
            caseId: evalCase.id,
            runNumber,
            expectedDecision: evalCase.expectedDecision,
            actualDecision,
            classification: classifyDecision(
              evalCase.expectedDecision,
              actualDecision,
            ),
            totalLatencyMs,
            ...telemetry,
            toolCallCount: flowResult.toolDecision.callCount,
            evidenceStatus: flowResult.data.evidenceStatus,
            errorCode: null,
          }),
        );
      } catch (error: unknown) {
        const totalLatencyMs = Math.max(0, clock.monotonicNow() - start);
        const compatibleTelemetry =
          telemetry.firstInteractionLatencyMs !== null &&
          telemetry.finalInteractionLatencyMs !== null &&
          totalLatencyMs +
            PROFESSOR_CONTEXT_TOOL_SELECTION_LATENCY_TOLERANCE_MS <
            telemetry.firstInteractionLatencyMs +
              telemetry.finalInteractionLatencyMs
            ? {
                ...telemetry,
                firstInteractionLatencyMs: null,
                finalInteractionLatencyMs: null,
              }
            : telemetry;
        results.push(
          professorContextToolSelectionEvalRunResultSchema.parse({
            caseId: evalCase.id,
            runNumber,
            expectedDecision: evalCase.expectedDecision,
            actualDecision: null,
            classification: "technical_error",
            totalLatencyMs,
            ...compatibleTelemetry,
            toolCallCount: null,
            evidenceStatus: null,
            errorCode: getProfessorContextToolSelectionSanitizedErrorCode(error),
          }),
        );
      }
    }
  }

  const count = (classification: ProfessorContextToolSelectionClassification) =>
    results.filter((result) => result.classification === classification).length;
  const correct = count("correct");
  const technicalErrors = count("technical_error");
  const validDecisions = results.length - technicalErrors;
  const confusionMatrix = emptyConfusionMatrix();
  for (const result of results) {
    if (result.actualDecision !== null) {
      confusionMatrix[result.expectedDecision][result.actualDecision] += 1;
    }
  }

  return professorContextToolSelectionEvalReportSchema.parse({
    runnerVersion: PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_RUNNER_VERSION,
    model: parsedConfig.model,
    promptVersion: parsedConfig.promptVersion,
    schemaVersion: parsedConfig.schemaVersion,
    evalSetVersion: parsedConfig.evalSetVersion,
    repetitions: parsedConfig.repetitions,
    startedAt,
    completedAt: clock.now().toISOString(),
    totalRuns: results.length,
    correct,
    falsePositives: count("false_positive"),
    falseNegatives: count("false_negative"),
    wrongTools: count("wrong_tool"),
    technicalErrors,
    decisionAccuracy:
      validDecisions === 0 ? null : correct / validDecisions,
    endToEndSuccessRate: results.length === 0 ? 0 : correct / results.length,
    completionRate:
      results.length === 0 ? 0 : validDecisions / results.length,
    confusionMatrix,
    metricsByExpectedDecision: buildMetricsByExpectedDecision(results),
    latency: buildLatencyMetrics(results),
    tokens: buildTokenMetrics(results),
    results,
  });
}
