import { writeFile } from "node:fs/promises";
import type { ResponseCreateParamsNonStreaming } from "openai/resources/responses/responses";
import {
  POSITION_CONTEXT_TOOL_SELECTION_EVAL_SET_VERSION,
  positionContextToolSelectionCases,
} from "../lib/ai/evals/position-context-tool-selection-cases";
import {
  POSITION_CONTEXT_TOOL_SELECTION_EVAL_MAX_REPETITIONS,
  positionContextToolSelectionEvalSnapshot,
  runPositionContextToolSelectionEvals,
  type PositionContextToolSelectionEvalReport,
  type PositionContextToolSelectionEvalRunConfig,
} from "../lib/ai/evals/run-position-context-tool-selection-evals";
import { getOpenAIClient } from "../lib/ai/openai-client";
import {
  selectProfessorIaPrompt,
  UnknownProfessorIaPromptVersionError,
  type SelectedProfessorIaPrompt,
} from "../lib/ai/prompts/professor-ia-prompts";
import { PROVISIONAL_TEACHER_RESPONSE_SCHEMA_VERSION } from "../lib/ai/schemas/provisional-teacher-response";
import {
  runAutoPositionContextToolFlow,
  type AutoPositionContextToolTransport,
} from "../lib/ai/tools/auto-position-context-tool-flow";
import { executeGetPositionContext } from "../lib/ai/tools/get-position-context";
import { POSITION_CONTEXT_TOOL_FLOW_MODEL } from "../lib/ai/tools/position-context-tool-flow";

export const POSITION_CONTEXT_TOOL_SELECTION_EVAL_REPORT_PATH =
  "/tmp/teachess-position-context-tool-selection-evals.json";
export const REAL_AI_EVALS_DISABLED_EXIT_CODE = 2;
export const REAL_AI_EVALS_CONFIGURATION_ERROR_EXIT_CODE = 1;

export type EvalEnvironmentReader = (name: string) => string | undefined;

export type ResolvedPositionContextToolSelectionEvalEnvironment =
  | {
      status: "disabled";
      exitCode: typeof REAL_AI_EVALS_DISABLED_EXIT_CODE;
      message: string;
    }
  | {
      status: "invalid";
      exitCode: typeof REAL_AI_EVALS_CONFIGURATION_ERROR_EXIT_CODE;
      errorCode:
        | "PROMPT_VERSION_REQUIRED"
        | "PROMPT_VERSION_INVALID"
        | "REPETITIONS_INVALID"
        | "OPENAI_API_KEY_REQUIRED";
    }
  | {
      status: "ready";
      exitCode: 0;
      config: PositionContextToolSelectionEvalRunConfig;
      prompt: SelectedProfessorIaPrompt;
    };

export function resolvePositionContextToolSelectionEvalEnvironment(
  readEnvironment: EvalEnvironmentReader,
): ResolvedPositionContextToolSelectionEvalEnvironment {
  if (readEnvironment("RUN_REAL_AI_EVALS") !== "true") {
    return {
      status: "disabled",
      exitCode: REAL_AI_EVALS_DISABLED_EXIT_CODE,
      message:
        "Runner real desabilitado. Defina RUN_REAL_AI_EVALS=true para autorizar explicitamente a execução.",
    };
  }

  const requestedPromptVersion = readEnvironment("AI_EVAL_PROMPT_VERSION");
  if (!requestedPromptVersion?.trim()) {
    return {
      status: "invalid",
      exitCode: REAL_AI_EVALS_CONFIGURATION_ERROR_EXIT_CODE,
      errorCode: "PROMPT_VERSION_REQUIRED",
    };
  }

  let prompt: SelectedProfessorIaPrompt;
  try {
    prompt = selectProfessorIaPrompt(requestedPromptVersion);
  } catch (error: unknown) {
    if (error instanceof UnknownProfessorIaPromptVersionError) {
      return {
        status: "invalid",
        exitCode: REAL_AI_EVALS_CONFIGURATION_ERROR_EXIT_CODE,
        errorCode: "PROMPT_VERSION_INVALID",
      };
    }
    throw error;
  }

  const rawRepetitions = readEnvironment("AI_EVAL_REPETITIONS");
  const repetitions = rawRepetitions === undefined ? 1 : Number(rawRepetitions);
  if (
    !Number.isInteger(repetitions) ||
    repetitions < 1 ||
    repetitions > POSITION_CONTEXT_TOOL_SELECTION_EVAL_MAX_REPETITIONS
  ) {
    return {
      status: "invalid",
      exitCode: REAL_AI_EVALS_CONFIGURATION_ERROR_EXIT_CODE,
      errorCode: "REPETITIONS_INVALID",
    };
  }

  if (!readEnvironment("OPENAI_API_KEY")?.trim()) {
    return {
      status: "invalid",
      exitCode: REAL_AI_EVALS_CONFIGURATION_ERROR_EXIT_CODE,
      errorCode: "OPENAI_API_KEY_REQUIRED",
    };
  }

  return {
    status: "ready",
    exitCode: 0,
    config: {
      model: POSITION_CONTEXT_TOOL_FLOW_MODEL,
      promptVersion: prompt.version,
      schemaVersion: PROVISIONAL_TEACHER_RESPONSE_SCHEMA_VERSION,
      evalSetVersion: POSITION_CONTEXT_TOOL_SELECTION_EVAL_SET_VERSION,
      repetitions,
    },
    prompt,
  };
}

type EvalOpenAIClient = ReturnType<typeof getOpenAIClient>;

export type PositionContextToolSelectionEvalCliDependencies = {
  readEnvironment: EvalEnvironmentReader;
  createClient: () => EvalOpenAIClient;
  writeJsonReport: (path: string, contents: string) => Promise<void>;
  writeLine: (line: string) => void;
};

function formatAccuracy(accuracy: number | null): string {
  return accuracy === null ? "n/a" : `${(accuracy * 100).toFixed(2)}%`;
}

export function formatPositionContextToolSelectionEvalSummary(
  report: PositionContextToolSelectionEvalReport,
): string[] {
  return [
    `Eval set: ${report.evalSetVersion}`,
    `Modelo: ${report.model}`,
    `Prompt: ${report.promptVersion}`,
    `Schema: ${report.schemaVersion}`,
    `Repetições: ${report.repetitions}`,
    `Execuções: ${report.totalRuns}`,
    `Acertos: ${report.correct}`,
    `Falsos positivos: ${report.falsePositives}`,
    `Falsos negativos: ${report.falseNegatives}`,
    `Erros técnicos: ${report.technicalErrors}`,
    `Accuracy observada: ${formatAccuracy(report.accuracy)}`,
    ...report.results.map(
      (result) =>
        `${result.caseId} #${result.runNumber}: ${result.classification} ` +
        `(esperado=${result.expectedDecision}, observado=${result.actualDecision ?? "erro"}, ` +
        `latência=${result.latencyMs.toFixed(2)}ms)`,
    ),
  ];
}

export async function runPositionContextToolSelectionEvalCli(
  dependencies: PositionContextToolSelectionEvalCliDependencies,
): Promise<number> {
  const environment = resolvePositionContextToolSelectionEvalEnvironment(
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

  const client = dependencies.createClient();
  const transport: AutoPositionContextToolTransport = {
    createResponse: (params: ResponseCreateParamsNonStreaming) =>
      client.responses.create(params),
    parseResponse: (params: ResponseCreateParamsNonStreaming) =>
      client.responses.parse(params),
  };
  const report = await runPositionContextToolSelectionEvals({
    cases: positionContextToolSelectionCases,
    authorizedSnapshot: positionContextToolSelectionEvalSnapshot,
    config: environment.config,
    prompt: environment.prompt,
    executeCase: ({ message, authorizedSnapshot, prompt }) =>
      runAutoPositionContextToolFlow(
        {
          message,
          authorizedSnapshot,
          promptVersion: prompt.version,
          systemPrompt: prompt.systemPrompt,
        },
        { transport, executeTool: executeGetPositionContext },
      ),
  });
  const json = `${JSON.stringify(report, null, 2)}\n`;

  for (const line of formatPositionContextToolSelectionEvalSummary(report)) {
    dependencies.writeLine(line);
  }
  dependencies.writeLine(json.trimEnd());
  await dependencies.writeJsonReport(
    POSITION_CONTEXT_TOOL_SELECTION_EVAL_REPORT_PATH,
    json,
  );
  dependencies.writeLine(
    `Relatório JSON sanitizado gravado em ${POSITION_CONTEXT_TOOL_SELECTION_EVAL_REPORT_PATH}.`,
  );
  return 0;
}

if (require.main === module) {
  runPositionContextToolSelectionEvalCli({
    readEnvironment: (name) => process.env[name],
    createClient: getOpenAIClient,
    writeJsonReport: (path, contents) => writeFile(path, contents, "utf8"),
    writeLine: (line) => console.log(line),
  })
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch(() => {
      console.error("Falha técnica não detalhada durante o runner de evals.");
      process.exitCode = REAL_AI_EVALS_CONFIGURATION_ERROR_EXIT_CODE;
    });
}
