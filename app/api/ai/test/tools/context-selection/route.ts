import {
  createProfessorContextRoute,
  professorContextFlowErrorStatus,
  PROFESSOR_CONTEXT_TOOL_REQUEST_MAX_BYTES,
  type ProfessorContextRouteDependencies,
  type ProfessorContextRouteOptions,
} from "@/lib/ai/routes/professor-context-route";

export const runtime = "nodejs";

export { PROFESSOR_CONTEXT_TOOL_REQUEST_MAX_BYTES };
export type { ProfessorContextRouteDependencies };

const technicalRouteOptions: ProfessorContextRouteOptions = {
  isEnabled: () => process.env.ENABLE_AI_TEST_ROUTE === "true",
  promptVersion: () => process.env.AI_TEST_PROMPT_VERSION,
  logPrefix: "[api/ai/test/tools/context-selection]",
  promptVersionErrorMessage:
    "A versão configurada para esta rota técnica é inválida.",
};

export const flowErrorStatus = professorContextFlowErrorStatus;

export function createProfessorContextToolRoute(
  dependencies?: ProfessorContextRouteDependencies,
) {
  return createProfessorContextRoute(technicalRouteOptions, dependencies);
}

export const POST = createProfessorContextToolRoute();
