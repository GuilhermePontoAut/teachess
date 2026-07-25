import {
  createProfessorContextRoute,
  type ProfessorContextRouteOptions,
} from "@/lib/ai/routes/professor-context-route";
import { PROFESSOR_IA_PROMPT_VERSION_V3 } from "@/lib/ai/prompts/professor-ia-system-prompt-v3";

export const runtime = "nodejs";

export function getPublicProfessorPromptVersion(
  configuredVersion = process.env.AI_PROFESSOR_PROMPT_VERSION,
): string {
  return configuredVersion ?? PROFESSOR_IA_PROMPT_VERSION_V3;
}

const publicRouteOptions: ProfessorContextRouteOptions = {
  isEnabled: () => true,
  promptVersion: () => getPublicProfessorPromptVersion(),
  logPrefix: "[api/ai/professor]",
  promptVersionErrorMessage:
    "A versão configurada do Professor IA é inválida.",
};

export const POST = createProfessorContextRoute(publicRouteOptions);
