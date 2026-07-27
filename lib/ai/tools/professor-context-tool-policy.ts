import { getGameContextOpenAITool, GET_GAME_CONTEXT_TOOL_NAME } from "./get-game-context.openai";
import {
  getPositionContextOpenAITool,
  GET_POSITION_CONTEXT_TOOL_NAME,
} from "./get-position-context.openai";
import type { AuthorizedProfessorContext } from "./professor-context-tool-flow.schemas";

export const PROFESSOR_TOOL_EXPOSURE_POLICIES = [
  "all_context_tools",
  "authorized_context_only",
] as const;

export type ProfessorToolExposurePolicy =
  (typeof PROFESSOR_TOOL_EXPOSURE_POLICIES)[number];

export type ProfessorContextToolName =
  | typeof GET_GAME_CONTEXT_TOOL_NAME
  | typeof GET_POSITION_CONTEXT_TOOL_NAME;

export const professorContextOpenAITools = [
  getGameContextOpenAITool,
  getPositionContextOpenAITool,
] as const;

export function getAllowedProfessorContextTools(
  authorizedContextType: AuthorizedProfessorContext["type"],
  allowContextLookup = true,
) {
  if (!allowContextLookup) return [] as const;
  switch (authorizedContextType) {
    case "game":
      return [getGameContextOpenAITool] as const;
    case "position":
      return [getPositionContextOpenAITool] as const;
    case "none":
      return [] as const;
  }
}

export function getProfessorContextToolsForExposurePolicy(
  authorizedContextType: AuthorizedProfessorContext["type"],
  policy: ProfessorToolExposurePolicy,
  allowContextLookup = true,
) {
  if (!allowContextLookup) return [];
  return policy === "all_context_tools"
    ? [...professorContextOpenAITools]
    : [...getAllowedProfessorContextTools(authorizedContextType)];
}

export function getOfferedProfessorContextToolNames(
  authorizedContextType: AuthorizedProfessorContext["type"],
  policy: ProfessorToolExposurePolicy,
  allowContextLookup = true,
): ProfessorContextToolName[] {
  return getProfessorContextToolsForExposurePolicy(
    authorizedContextType,
    policy,
    allowContextLookup,
  ).map((tool) => tool.name as ProfessorContextToolName);
}

export function assertToolAllowedForAuthorizedContext(
  functionCallName: string,
  authorizedContextType: AuthorizedProfessorContext["type"],
): asserts functionCallName is ProfessorContextToolName {
  const allowed =
    (authorizedContextType === "game" &&
      functionCallName === GET_GAME_CONTEXT_TOOL_NAME) ||
    (authorizedContextType === "position" &&
      functionCallName === GET_POSITION_CONTEXT_TOOL_NAME);

  if (!allowed) {
    throw new Error("PROFESSOR_CONTEXT_TOOL_NOT_AUTHORIZED");
  }
}
