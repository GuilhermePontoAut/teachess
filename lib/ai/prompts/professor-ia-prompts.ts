import {
  PROFESSOR_IA_PROMPT_VERSION,
  PROFESSOR_IA_SYSTEM_PROMPT,
} from "@/lib/ai/prompts/professor-ia-system-prompt-v1";
import {
  PROFESSOR_IA_PROMPT_VERSION_V2,
  PROFESSOR_IA_SYSTEM_PROMPT_V2,
} from "@/lib/ai/prompts/professor-ia-system-prompt-v2";
import {
  PROFESSOR_IA_PROMPT_VERSION_V3,
  PROFESSOR_IA_SYSTEM_PROMPT_V3,
} from "@/lib/ai/prompts/professor-ia-system-prompt-v3";

const PROFESSOR_IA_PROMPTS = {
  [PROFESSOR_IA_PROMPT_VERSION]: PROFESSOR_IA_SYSTEM_PROMPT,
  [PROFESSOR_IA_PROMPT_VERSION_V2]: PROFESSOR_IA_SYSTEM_PROMPT_V2,
  [PROFESSOR_IA_PROMPT_VERSION_V3]: PROFESSOR_IA_SYSTEM_PROMPT_V3,
} as const;

export type ProfessorIaPromptVersion = keyof typeof PROFESSOR_IA_PROMPTS;

export type SelectedProfessorIaPrompt = {
  version: ProfessorIaPromptVersion;
  systemPrompt: (typeof PROFESSOR_IA_PROMPTS)[ProfessorIaPromptVersion];
};

export class UnknownProfessorIaPromptVersionError extends Error {
  constructor() {
    super("A versão configurada do prompt do Professor IA é desconhecida.");
    this.name = "UnknownProfessorIaPromptVersionError";
  }
}

function isProfessorIaPromptVersion(value: string): value is ProfessorIaPromptVersion {
  return Object.prototype.hasOwnProperty.call(PROFESSOR_IA_PROMPTS, value);
}

export function selectProfessorIaPrompt(
  requestedVersion?: string,
): SelectedProfessorIaPrompt {
  const version = requestedVersion ?? PROFESSOR_IA_PROMPT_VERSION;

  if (!isProfessorIaPromptVersion(version)) {
    throw new UnknownProfessorIaPromptVersionError();
  }

  return {
    version,
    systemPrompt: PROFESSOR_IA_PROMPTS[version],
  };
}
