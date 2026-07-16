import {
  createProfessorContextRoute,
  type ProfessorContextRouteOptions,
} from "@/lib/ai/routes/professor-context-route";
import { PROFESSOR_IA_PROMPT_VERSION_V3 } from "@/lib/ai/prompts/professor-ia-system-prompt-v3";

export const runtime = "nodejs";

const publicRouteOptions: ProfessorContextRouteOptions = {
  isEnabled: () => true,
  promptVersion: () =>
    process.env.AI_PROFESSOR_PROMPT_VERSION ??
    PROFESSOR_IA_PROMPT_VERSION_V3,
  logPrefix: "[api/ai/professor]",
  promptVersionErrorMessage:
    "A versão configurada do Professor IA é inválida.",
};

export const POST = createProfessorContextRoute(publicRouteOptions);
