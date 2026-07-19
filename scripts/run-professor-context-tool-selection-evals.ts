import { access, writeFile } from "node:fs/promises";
import type {
  Response,
  ResponseCreateParamsNonStreaming,
  ResponseUsage,
} from "openai/resources/responses/responses";
import {
  PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_SET_VERSION,
  professorContextToolSelectionCases,
} from "../lib/ai/evals/professor-context-tool-selection-cases";
import {
  combineProfessorContextToolSelectionUsages,
  createProfessorContextToolSelectionTechnicalErrorDetails,
  createProfessorContextToolSelectionTechnicalErrorSignature,
  getProfessorContextToolSelectionObservedWrongTool,
  getProfessorContextToolSelectionSanitizedErrorCode,
  InvalidProfessorContextToolSelectionEvalCaseSetError,
  INVALID_PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_CASE_SET,
  PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_MAX_REPETITIONS,
  runProfessorContextToolSelectionEvals,
  validateProfessorContextToolSelectionEvalCaseSet,
  type ProfessorContextToolSelectionEvalExecutionOutcome,
  type ProfessorContextToolSelectionEvalReport,
  type ProfessorContextToolSelectionEvalRunConfig,
  type ProfessorContextToolSelectionEvalRunnerClock,
  type ProfessorContextToolSelectionTelemetry,
} from "../lib/ai/evals/run-professor-context-tool-selection-evals";
import { getOpenAIClient } from "../lib/ai/openai-client";
import {
  selectProfessorIaPrompt,
  type SelectedProfessorIaPrompt,
} from "../lib/ai/prompts/professor-ia-prompts";
import { PROVISIONAL_TEACHER_RESPONSE_SCHEMA_VERSION } from "../lib/ai/schemas/provisional-teacher-response";
import {
  runProfessorContextToolFlow,
  type ProfessorContextToolTransport,
} from "../lib/ai/tools/professor-context-tool-flow";
import { executeGetGameContext } from "../lib/ai/tools/get-game-context";
import { executeGetPositionContext } from "../lib/ai/tools/get-position-context";
import { PROFESSOR_CONTEXT_TOOL_FLOW_MODEL } from "../lib/ai/tools/professor-context-tool-flow.schemas";

export const PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_REPORT_PATH =
  "/tmp/teachess-professor-context-tool-selection-evals.json";
export const PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_DISABLED_EXIT_CODE = 2;
export const PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_ERROR_EXIT_CODE = 1;

export type ProfessorContextEvalEnvironmentReader = (
  name: string,
) => string | undefined;

export type ResolvedProfessorContextToolSelectionEvalEnvironment =
  | {
      status: "disabled";
      exitCode: typeof PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_DISABLED_EXIT_CODE;
      message: string;
    }
  | {
      status: "invalid";
      exitCode: typeof PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_ERROR_EXIT_CODE;
      errorCode:
        | "PROMPT_VERSION_REQUIRED"
        | "PROMPT_VERSION_INVALID"
        | "REPETITIONS_REQUIRED"
        | "REPETITIONS_INVALID"
        | "OUTPUT_PATH_INVALID"
        | "OPENAI_API_KEY_REQUIRED";
    }
  | {
      status: "ready";
      exitCode: 0;
      config: ProfessorContextToolSelectionEvalRunConfig;
      prompt: SelectedProfessorIaPrompt;
      outputPath: string;
      allowOverwrite: boolean;
      consecutiveTechnicalErrorThreshold: number | null;
    };

export function resolveProfessorContextToolSelectionEvalEnvironment(
  readEnvironment: ProfessorContextEvalEnvironmentReader,
): ResolvedProfessorContextToolSelectionEvalEnvironment {
  if (readEnvironment("RUN_REAL_AI_EVALS") !== "true") {
    return {
      status: "disabled",
      exitCode: PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_DISABLED_EXIT_CODE,
      message:
        "Runner real desabilitado. Defina RUN_REAL_AI_EVALS=true para autorizar explicitamente a execução.",
    };
  }

  const promptVersion = readEnvironment("AI_EVAL_PROMPT_VERSION");
  if (!promptVersion?.trim()) {
    return {
      status: "invalid",
      exitCode: PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_ERROR_EXIT_CODE,
      errorCode: "PROMPT_VERSION_REQUIRED",
    };
  }
  if (
    promptVersion !== "professor-ia-v2" &&
    promptVersion !== "professor-ia-v3"
  ) {
    return {
      status: "invalid",
      exitCode: PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_ERROR_EXIT_CODE,
      errorCode: "PROMPT_VERSION_INVALID",
    };
  }

  const rawRepetitions = readEnvironment("AI_EVAL_REPETITIONS");
  if (rawRepetitions === undefined || rawRepetitions.trim().length === 0) {
    return {
      status: "invalid",
      exitCode: PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_ERROR_EXIT_CODE,
      errorCode: "REPETITIONS_REQUIRED",
    };
  }
  const repetitions = Number(rawRepetitions);
  if (
    !Number.isInteger(repetitions) ||
    repetitions < 1 ||
    repetitions > PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_MAX_REPETITIONS
  ) {
    return {
      status: "invalid",
      exitCode: PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_ERROR_EXIT_CODE,
      errorCode: "REPETITIONS_INVALID",
    };
  }

  const configuredOutputPath = readEnvironment("AI_EVAL_OUTPUT_PATH");
  if (configuredOutputPath !== undefined && configuredOutputPath.length === 0) {
    return {
      status: "invalid",
      exitCode: PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_ERROR_EXIT_CODE,
      errorCode: "OUTPUT_PATH_INVALID",
    };
  }
  const outputPath =
    configuredOutputPath ?? PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_REPORT_PATH;
  const allowOverwrite = readEnvironment("AI_EVAL_ALLOW_OVERWRITE") === "true";
  const rawThreshold = readEnvironment(
    "AI_EVAL_ABORT_AFTER_CONSECUTIVE_TECHNICAL_ERRORS",
  );
  const parsedThreshold = Number(rawThreshold);
  const consecutiveTechnicalErrorThreshold =
    rawThreshold?.trim() && Number.isInteger(parsedThreshold) && parsedThreshold > 0
      ? parsedThreshold
      : null;

  if (!readEnvironment("OPENAI_API_KEY")?.trim()) {
    return {
      status: "invalid",
      exitCode: PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_ERROR_EXIT_CODE,
      errorCode: "OPENAI_API_KEY_REQUIRED",
    };
  }

  const prompt = selectProfessorIaPrompt(promptVersion);
  return {
    status: "ready",
    exitCode: 0,
    config: {
      model: PROFESSOR_CONTEXT_TOOL_FLOW_MODEL,
      promptVersion,
      schemaVersion: PROVISIONAL_TEACHER_RESPONSE_SCHEMA_VERSION,
      evalSetVersion: PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_SET_VERSION,
      repetitions,
    },
    prompt,
    outputPath,
    allowOverwrite,
    consecutiveTechnicalErrorThreshold,
  };
}

type EvalOpenAIClient = ReturnType<typeof getOpenAIClient>;

export type ProfessorContextToolSelectionEvalCliDependencies = {
  cases?: readonly unknown[];
  readEnvironment: ProfessorContextEvalEnvironmentReader;
  createClient: () => EvalOpenAIClient;
  writeJsonReport: (path: string, contents: string) => Promise<void>;
  reportExists?: (path: string) => Promise<boolean>;
  writeLine: (line: string) => void;
  clock?: ProfessorContextToolSelectionEvalRunnerClock;
};

const defaultClock: ProfessorContextToolSelectionEvalRunnerClock = {
  now: () => new Date(),
  monotonicNow: () => performance.now(),
};

type UsageFields = Pick<
  ResponseUsage,
  "input_tokens" | "output_tokens" | "total_tokens"
>;

class StagedProviderError extends Error {
  readonly technicalErrorStage:
    | "first_response_create"
    | "second_response_parse";

  constructor(
    stage: "first_response_create" | "second_response_parse",
    cause: unknown,
  ) {
    super("Falha sanitizada no transporte do provider.", { cause });
    this.name = "StagedProviderError";
    this.technicalErrorStage = stage;
  }
}

function getUsage(response: unknown): UsageFields | null {
  if (typeof response !== "object" || response === null || !("usage" in response)) {
    return null;
  }
  const usage = response.usage;
  if (typeof usage !== "object" || usage === null) return null;
  if (
    !("input_tokens" in usage) ||
    !("output_tokens" in usage) ||
    !("total_tokens" in usage) ||
    typeof usage.input_tokens !== "number" ||
    typeof usage.output_tokens !== "number" ||
    typeof usage.total_tokens !== "number"
  ) {
    return null;
  }
  return {
    input_tokens: usage.input_tokens,
    output_tokens: usage.output_tokens,
    total_tokens: usage.total_tokens,
  };
}

function createMeasuredTransport(
  client: EvalOpenAIClient,
  clock: ProfessorContextToolSelectionEvalRunnerClock,
) {
  let firstInteractionLatencyMs: number | null = null;
  let finalInteractionLatencyMs: number | null = null;
  let firstUsage: UsageFields | null = null;
  let finalUsage: UsageFields | null = null;

  const transport: ProfessorContextToolTransport = {
    async createResponse(params: ResponseCreateParamsNonStreaming) {
      const startedAt = clock.monotonicNow();
      try {
        const response: Response = await client.responses.create(params);
        firstUsage = getUsage(response);
        return response;
      } catch (error: unknown) {
        throw new StagedProviderError("first_response_create", error);
      } finally {
        firstInteractionLatencyMs = Math.max(
          0,
          clock.monotonicNow() - startedAt,
        );
      }
    },
    async parseResponse(params: ResponseCreateParamsNonStreaming) {
      const startedAt = clock.monotonicNow();
      try {
        const response = await client.responses.parse(params);
        finalUsage = getUsage(response);
        return response;
      } catch (error: unknown) {
        throw new StagedProviderError("second_response_parse", error);
      } finally {
        finalInteractionLatencyMs = Math.max(
          0,
          clock.monotonicNow() - startedAt,
        );
      }
    },
  };

  return {
    transport,
    telemetry(): ProfessorContextToolSelectionTelemetry {
      return {
        firstInteractionLatencyMs,
        finalInteractionLatencyMs,
        tokens: combineProfessorContextToolSelectionUsages(
          firstUsage,
          finalUsage,
        ),
      };
    },
  };
}

function formatPercent(value: number | null): string {
  return value === null ? "n/a" : `${(value * 100).toFixed(2)}%`;
}

export function formatProfessorContextToolSelectionEvalSummary(
  report: ProfessorContextToolSelectionEvalReport,
): string[] {
  if (report.reportCompleteness === "partial") {
    return [
      `Experimento incompleto: ${report.completedCaseRuns}/${report.plannedCaseRuns} execuções concluídas.`,
      `Execução abortada: ${report.abortReason}.`,
      "Resultados parciais são inconclusivos e não constituem comparação válida de estabilidade.",
    ];
  }
  return [
    `Eval set: ${report.evalSetVersion}`,
    `Modelo: ${report.model}`,
    `Prompt: ${report.promptVersion}`,
    `Repetições: ${report.repetitions}`,
    `Execuções: ${report.totalRuns}`,
    `Acertos: ${report.correct}`,
    `Falsos positivos: ${report.falsePositives}`,
    `Falsos negativos: ${report.falseNegatives}`,
    `Tools incorretas: ${report.wrongTools}`,
    `Erros técnicos: ${report.technicalErrors}`,
    `Decision accuracy: ${formatPercent(report.decisionAccuracy)}`,
    `Sucesso ponta a ponta: ${formatPercent(report.endToEndSuccessRate)}`,
    `Completion rate: ${formatPercent(report.completionRate)}`,
  ];
}

export async function runProfessorContextToolSelectionEvalCli(
  dependencies: ProfessorContextToolSelectionEvalCliDependencies,
): Promise<number> {
  const cases = dependencies.cases ?? professorContextToolSelectionCases;
  try {
    validateProfessorContextToolSelectionEvalCaseSet(cases);
  } catch (error: unknown) {
    if (error instanceof InvalidProfessorContextToolSelectionEvalCaseSetError) {
      dependencies.writeLine(
        `Falha técnica sanitizada: ${INVALID_PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_CASE_SET}.`,
      );
      return PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_ERROR_EXIT_CODE;
    }
    throw error;
  }

  const environment = resolveProfessorContextToolSelectionEvalEnvironment(
    dependencies.readEnvironment,
  );
  if (environment.status === "disabled") {
    dependencies.writeLine(environment.message);
    return environment.exitCode;
  }
  if (environment.status === "invalid") {
    dependencies.writeLine(`Configuração inválida: ${environment.errorCode}.`);
    return environment.exitCode;
  }

  const reportExists = dependencies.reportExists ?? (async () => false);
  if (!environment.allowOverwrite && await reportExists(environment.outputPath)) {
    dependencies.writeLine("Falha técnica sanitizada: REPORT_ALREADY_EXISTS.");
    return PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_ERROR_EXIT_CODE;
  }

  const clock = dependencies.clock ?? defaultClock;
  const client = dependencies.createClient();
  const report = await runProfessorContextToolSelectionEvals({
    cases,
    config: environment.config,
    prompt: environment.prompt,
    clock,
    consecutiveTechnicalErrorThreshold:
      environment.consecutiveTechnicalErrorThreshold,
    outputPath: environment.outputPath,
    executeCase: async ({ message, authorizedContext, prompt }) => {
      const measured = createMeasuredTransport(client, clock);
      try {
        const flowResult = await runProfessorContextToolFlow(
          {
            message,
            authorizedContext,
            promptVersion: prompt.version,
            systemPrompt: prompt.systemPrompt,
          },
          {
            transport: measured.transport,
            executeGameTool: executeGetGameContext,
            executePositionTool: executeGetPositionContext,
          },
        );
        return {
          status: "success",
          flowResult,
          telemetry: measured.telemetry(),
        } satisfies ProfessorContextToolSelectionEvalExecutionOutcome;
      } catch (error: unknown) {
        const observedWrongTool =
          getProfessorContextToolSelectionObservedWrongTool(error);
        if (observedWrongTool !== null) {
          return {
            status: "wrong_tool",
            actualDecision: observedWrongTool,
            telemetry: measured.telemetry(),
          } satisfies ProfessorContextToolSelectionEvalExecutionOutcome;
        }
        const errorCode = getProfessorContextToolSelectionSanitizedErrorCode(error);
        const technicalErrorDetails =
          createProfessorContextToolSelectionTechnicalErrorDetails(
            error,
            errorCode,
          );
        return {
          status: "technical_error",
          errorCode,
          technicalErrorDetails,
          technicalErrorSignature:
            createProfessorContextToolSelectionTechnicalErrorSignature(
              technicalErrorDetails,
            ),
          telemetry: measured.telemetry(),
        } satisfies ProfessorContextToolSelectionEvalExecutionOutcome;
      }
    },
  });
  const json = `${JSON.stringify(report, null, 2)}\n`;

  try {
    await dependencies.writeJsonReport(
      environment.outputPath,
      json,
    );
  } catch (error: unknown) {
    const technicalErrorDetails =
      createProfessorContextToolSelectionTechnicalErrorDetails(
        {
          name: error instanceof Error ? error.name : undefined,
          code: "REPORT_WRITE_FAILED",
          technicalErrorStage: "report_generation",
        },
        "REPORT_WRITE_FAILED",
      );
    dependencies.writeLine(
      `Falha técnica sanitizada: ${JSON.stringify({
        errorCode: "REPORT_WRITE_FAILED",
        technicalErrorDetails,
      })}`,
    );
    return PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_ERROR_EXIT_CODE;
  }

  for (const line of formatProfessorContextToolSelectionEvalSummary(report)) {
    dependencies.writeLine(line);
  }
  dependencies.writeLine(json.trimEnd());
  dependencies.writeLine(
    `Relatório JSON sanitizado gravado em ${environment.outputPath}.`,
  );
  return report.aborted
    ? PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_ERROR_EXIT_CODE
    : 0;
}

if (require.main === module) {
  runProfessorContextToolSelectionEvalCli({
    readEnvironment: (name) => process.env[name],
    createClient: getOpenAIClient,
    writeJsonReport: (path, contents) => writeFile(path, contents, "utf8"),
    reportExists: async (path) => {
      try {
        await access(path);
        return true;
      } catch {
        return false;
      }
    },
    writeLine: (line) => console.log(line),
  })
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch(() => {
      console.error("Falha técnica sanitizada no runner de evals.");
      process.exitCode = PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_ERROR_EXIT_CODE;
    });
}
