import { z } from "zod";
import {
  type SelectedProfessorIaPrompt,
} from "../prompts/professor-ia-prompts";
import {
  PROVISIONAL_TEACHER_RESPONSE_SCHEMA_VERSION,
  provisionalTeacherResponseSchema,
} from "../schemas/provisional-teacher-response";
import {
  AutoPositionContextToolFlowError,
  autoPositionContextToolFlowResultSchema,
  type AutoPositionContextToolFlowResult,
} from "../tools/auto-position-context-tool-flow";
import {
  authorizedPositionSnapshotSchema,
  type AuthorizedPositionSnapshot,
} from "../tools/get-position-context.schemas";
import { POSITION_CONTEXT_TOOL_FLOW_MODEL } from "../tools/position-context-tool-flow";
import {
  POSITION_CONTEXT_TOOL_SELECTION_EVAL_SET_VERSION,
  positionContextToolSelectionCases,
  type PositionContextToolSelectionEvalCase,
  type PositionContextToolSelectionExpectedDecision,
} from "./position-context-tool-selection-cases";

export const POSITION_CONTEXT_TOOL_SELECTION_EVAL_MAX_REPETITIONS = 5;
export const INVALID_POSITION_CONTEXT_TOOL_SELECTION_EVAL_CASE_SET =
  "INVALID_EVAL_CASE_SET" as const;

export class InvalidPositionContextToolSelectionEvalCaseSetError extends Error {
  readonly code = INVALID_POSITION_CONTEXT_TOOL_SELECTION_EVAL_CASE_SET;

  constructor() {
    super("O conjunto de casos de avaliação não corresponde à versão canônica.");
    this.name = "InvalidPositionContextToolSelectionEvalCaseSetError";
  }
}

export const positionContextToolSelectionEvalSnapshot = Object.freeze(
  authorizedPositionSnapshotSchema.parse({
    positionContextId: "auto-selection-eval-position-01",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    imageOrigin: "physical_board_photo",
    sourceContext: "personal_study",
    recognitionStatus: "demo_available",
    dataNature: "simulated_demo",
    confirmationStatus: "confirmed",
  }),
);

const promptVersionSchema = z.enum(["professor-ia-v1", "professor-ia-v2"]);

export const positionContextToolSelectionEvalRunConfigSchema = z
  .object({
    model: z.literal(POSITION_CONTEXT_TOOL_FLOW_MODEL),
    promptVersion: promptVersionSchema,
    schemaVersion: z.literal(PROVISIONAL_TEACHER_RESPONSE_SCHEMA_VERSION),
    evalSetVersion: z.literal(
      POSITION_CONTEXT_TOOL_SELECTION_EVAL_SET_VERSION,
    ),
    repetitions: z
      .number()
      .int()
      .min(1)
      .max(POSITION_CONTEXT_TOOL_SELECTION_EVAL_MAX_REPETITIONS),
  })
  .strict();

export type PositionContextToolSelectionEvalRunConfig = z.infer<
  typeof positionContextToolSelectionEvalRunConfigSchema
>;

const decisionSchema = z.enum(["called", "not_called"]);
const classificationSchema = z.enum([
  "correct",
  "false_positive",
  "false_negative",
  "technical_error",
]);
const sanitizedErrorCodeSchema = z
  .string()
  .regex(/^[A-Z][A-Z0-9_]{0,63}$/);

export const positionContextToolSelectionEvalRunResultSchema = z
  .object({
    caseId: z.string().regex(/^AUTO-SEL-00[1-6]$/),
    runNumber: z
      .number()
      .int()
      .min(1)
      .max(POSITION_CONTEXT_TOOL_SELECTION_EVAL_MAX_REPETITIONS),
    expectedDecision: decisionSchema,
    actualDecision: decisionSchema.nullable(),
    classification: classificationSchema,
    latencyMs: z.number().finite().nonnegative(),
    toolCallCount: z.union([z.literal(0), z.literal(1)]).nullable(),
    evidenceStatus: provisionalTeacherResponseSchema.shape.evidenceStatus.nullable(),
    errorCode: sanitizedErrorCodeSchema.nullable(),
  })
  .strict()
  .superRefine((result, context) => {
    const issue = (path: PropertyKey[], message: string) =>
      context.addIssue({ code: "custom", path, message });

    if (result.classification === "technical_error") {
      if (result.actualDecision !== null) {
        issue(["actualDecision"], "Erro técnico não pode conter decisão.");
      }
      if (result.toolCallCount !== null) {
        issue(["toolCallCount"], "Erro técnico não pode conter call count.");
      }
      if (result.evidenceStatus !== null) {
        issue(["evidenceStatus"], "Erro técnico não pode conter evidência.");
      }
      if (result.errorCode === null) {
        issue(["errorCode"], "Erro técnico exige código sanitizado.");
      }
      return;
    }

    if (result.actualDecision === null) {
      issue(["actualDecision"], "Execução válida exige decisão.");
      return;
    }
    if (result.errorCode !== null) {
      issue(["errorCode"], "Execução válida não pode conter erro.");
    }
    if (result.evidenceStatus === null) {
      issue(["evidenceStatus"], "Execução válida exige estado de evidência.");
    }
    const expectedCallCount = result.actualDecision === "called" ? 1 : 0;
    if (result.toolCallCount !== expectedCallCount) {
      issue(["toolCallCount"], "Call count deve corresponder à decisão.");
    }

    const expectedClassification = classifyDecision(
      result.expectedDecision,
      result.actualDecision,
    );
    if (result.classification !== expectedClassification) {
      issue(["classification"], "Classificação não corresponde às decisões.");
    }
  });

export type PositionContextToolSelectionEvalRunResult = z.infer<
  typeof positionContextToolSelectionEvalRunResultSchema
>;

export const positionContextToolSelectionEvalReportSchema = z
  .object({
    evalSetVersion: z.literal(
      POSITION_CONTEXT_TOOL_SELECTION_EVAL_SET_VERSION,
    ),
    model: z.literal(POSITION_CONTEXT_TOOL_FLOW_MODEL),
    promptVersion: promptVersionSchema,
    schemaVersion: z.literal(PROVISIONAL_TEACHER_RESPONSE_SCHEMA_VERSION),
    repetitions: z
      .number()
      .int()
      .min(1)
      .max(POSITION_CONTEXT_TOOL_SELECTION_EVAL_MAX_REPETITIONS),
    startedAt: z.iso.datetime(),
    completedAt: z.iso.datetime(),
    totalRuns: z.number().int().nonnegative(),
    correct: z.number().int().nonnegative(),
    falsePositives: z.number().int().nonnegative(),
    falseNegatives: z.number().int().nonnegative(),
    technicalErrors: z.number().int().nonnegative(),
    accuracy: z.number().min(0).max(1).nullable(),
    results: z.array(positionContextToolSelectionEvalRunResultSchema),
  })
  .strict()
  .superRefine((report, context) => {
    const count = (classification: PositionContextToolSelectionEvalRunResult["classification"]) =>
      report.results.filter((result) => result.classification === classification)
        .length;
    const expectedCounts = {
      correct: count("correct"),
      falsePositives: count("false_positive"),
      falseNegatives: count("false_negative"),
      technicalErrors: count("technical_error"),
    };

    if (report.totalRuns !== report.results.length) {
      context.addIssue({
        code: "custom",
        path: ["totalRuns"],
        message: "totalRuns deve corresponder aos resultados.",
      });
    }
    if (report.totalRuns !== 6 * report.repetitions) {
      context.addIssue({
        code: "custom",
        path: ["totalRuns"],
        message: "totalRuns deve ser seis casos vezes repetitions.",
      });
    }
    for (const [field, expected] of Object.entries(expectedCounts)) {
      if (report[field as keyof typeof expectedCounts] !== expected) {
        context.addIssue({
          code: "custom",
          path: [field],
          message: "Contador não corresponde aos resultados.",
        });
      }
    }

    const validDecisions = report.results.length - expectedCounts.technicalErrors;
    const expectedAccuracy =
      validDecisions === 0 ? null : expectedCounts.correct / validDecisions;
    if (report.accuracy !== expectedAccuracy) {
      context.addIssue({
        code: "custom",
        path: ["accuracy"],
        message: "Accuracy deve excluir erros técnicos do denominador.",
      });
    }
  });

export type PositionContextToolSelectionEvalReport = z.infer<
  typeof positionContextToolSelectionEvalReportSchema
>;

export type PositionContextToolSelectionEvalExecutorInput = {
  message: string;
  authorizedSnapshot: Readonly<AuthorizedPositionSnapshot>;
  prompt: SelectedProfessorIaPrompt;
};

export type PositionContextToolSelectionEvalExecutor = (
  input: PositionContextToolSelectionEvalExecutorInput,
) => Promise<AutoPositionContextToolFlowResult>;

export type PositionContextToolSelectionEvalRunnerClock = {
  now: () => Date;
  monotonicNow: () => number;
};

export type RunPositionContextToolSelectionEvalsInput = {
  cases: readonly PositionContextToolSelectionEvalCase[];
  authorizedSnapshot: AuthorizedPositionSnapshot;
  config: PositionContextToolSelectionEvalRunConfig;
  prompt: SelectedProfessorIaPrompt;
  executeCase: PositionContextToolSelectionEvalExecutor;
  clock?: PositionContextToolSelectionEvalRunnerClock;
};

const defaultClock: PositionContextToolSelectionEvalRunnerClock = {
  now: () => new Date(),
  monotonicNow: () => performance.now(),
};

function classifyDecision(
  expectedDecision: PositionContextToolSelectionExpectedDecision,
  actualDecision: PositionContextToolSelectionExpectedDecision,
): "correct" | "false_positive" | "false_negative" {
  if (actualDecision === expectedDecision) {
    return "correct";
  }
  return expectedDecision === "not_called"
    ? "false_positive"
    : "false_negative";
}

function sanitizedErrorCode(error: unknown): string {
  if (error instanceof AutoPositionContextToolFlowError) {
    return error.code;
  }
  if (error instanceof z.ZodError) {
    return "FLOW_RESULT_INVALID";
  }
  return "UNEXPECTED_ERROR";
}

function freezeSnapshot(
  snapshot: AuthorizedPositionSnapshot,
): Readonly<AuthorizedPositionSnapshot> {
  return Object.freeze(authorizedPositionSnapshotSchema.parse(snapshot));
}

function hasSameProhibitedBehaviors(
  received: readonly string[],
  canonical: readonly string[],
): boolean {
  return (
    received.length === canonical.length &&
    received.every((behavior, index) => behavior === canonical[index])
  );
}

function validateCanonicalEvalCaseSet(
  cases: readonly PositionContextToolSelectionEvalCase[],
): void {
  const hasExactlySixCases =
    cases.length === 6 && positionContextToolSelectionCases.length === 6;
  const hasUniqueIds =
    new Set(cases.map((evalCase) => evalCase.id)).size === cases.length;
  const matchesCanonicalContent = cases.every((evalCase, index) => {
    const canonicalCase = positionContextToolSelectionCases[index];

    return (
      canonicalCase !== undefined &&
      evalCase.id === canonicalCase.id &&
      evalCase.message === canonicalCase.message &&
      evalCase.expectedDecision === canonicalCase.expectedDecision &&
      evalCase.rationale === canonicalCase.rationale &&
      evalCase.status === canonicalCase.status &&
      hasSameProhibitedBehaviors(
        evalCase.prohibitedBehaviors,
        canonicalCase.prohibitedBehaviors,
      )
    );
  });

  if (!hasExactlySixCases || !hasUniqueIds || !matchesCanonicalContent) {
    throw new InvalidPositionContextToolSelectionEvalCaseSetError();
  }
}

export async function runPositionContextToolSelectionEvals({
  cases,
  authorizedSnapshot,
  config,
  prompt,
  executeCase,
  clock = defaultClock,
}: RunPositionContextToolSelectionEvalsInput): Promise<PositionContextToolSelectionEvalReport> {
  validateCanonicalEvalCaseSet(cases);

  const parsedConfig = positionContextToolSelectionEvalRunConfigSchema.parse(config);
  if (prompt.version !== parsedConfig.promptVersion) {
    throw new Error("A versão do prompt não corresponde à configuração do eval.");
  }

  const frozenSnapshot = freezeSnapshot(authorizedSnapshot);
  const startedAt = clock.now().toISOString();
  const results: PositionContextToolSelectionEvalRunResult[] = [];

  for (const evalCase of cases) {
    for (let runNumber = 1; runNumber <= parsedConfig.repetitions; runNumber += 1) {
      const start = clock.monotonicNow();

      try {
        const flowResult = autoPositionContextToolFlowResultSchema.parse(
          await executeCase({
            message: evalCase.message,
            authorizedSnapshot: frozenSnapshot,
            prompt,
          }),
        );
        const latencyMs = Math.max(0, clock.monotonicNow() - start);
        const actualDecision = flowResult.toolSelection.decision;
        results.push(
          positionContextToolSelectionEvalRunResultSchema.parse({
            caseId: evalCase.id,
            runNumber,
            expectedDecision: evalCase.expectedDecision,
            actualDecision,
            classification: classifyDecision(
              evalCase.expectedDecision,
              actualDecision,
            ),
            latencyMs,
            toolCallCount: flowResult.toolSelection.callCount,
            evidenceStatus: flowResult.data.evidenceStatus,
            errorCode: null,
          }),
        );
      } catch (error: unknown) {
        const latencyMs = Math.max(0, clock.monotonicNow() - start);
        results.push(
          positionContextToolSelectionEvalRunResultSchema.parse({
            caseId: evalCase.id,
            runNumber,
            expectedDecision: evalCase.expectedDecision,
            actualDecision: null,
            classification: "technical_error",
            latencyMs,
            toolCallCount: null,
            evidenceStatus: null,
            errorCode: sanitizedErrorCode(error),
          }),
        );
      }
    }
  }

  const correct = results.filter(
    (result) => result.classification === "correct",
  ).length;
  const falsePositives = results.filter(
    (result) => result.classification === "false_positive",
  ).length;
  const falseNegatives = results.filter(
    (result) => result.classification === "false_negative",
  ).length;
  const technicalErrors = results.filter(
    (result) => result.classification === "technical_error",
  ).length;
  const validDecisions = results.length - technicalErrors;

  return positionContextToolSelectionEvalReportSchema.parse({
    evalSetVersion: parsedConfig.evalSetVersion,
    model: parsedConfig.model,
    promptVersion: parsedConfig.promptVersion,
    schemaVersion: parsedConfig.schemaVersion,
    repetitions: parsedConfig.repetitions,
    startedAt,
    completedAt: clock.now().toISOString(),
    totalRuns: results.length,
    correct,
    falsePositives,
    falseNegatives,
    technicalErrors,
    accuracy: validDecisions === 0 ? null : correct / validDecisions,
    results,
  });
}
