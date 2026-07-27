import type {
  FutureAiContextRef,
  ProfessorToolDecision,
} from "./demo";

export type ProfessorDataAccessPreference = {
  allowContextLookup: boolean;
};

export function defaultAllowContextLookup(
  context: FutureAiContextRef | null,
): boolean {
  return (
    context?.legacy !== true &&
    (context?.type === "game-analysis" || context?.type === "saved-position")
  );
}

export function professorResponseSourceLabel(
  preference: ProfessorDataAccessPreference | null,
  decision: ProfessorToolDecision | null,
): string {
  if (preference?.allowContextLookup === false) {
    return "Consulta aos dados desativada nesta pergunta";
  }
  if (decision === null) return "Resposta preservada do histórico anterior";
  if (decision.status === "not_called") {
    return "Resposta sem consulta aos dados selecionados";
  }
  return decision.name === "get_game_context"
    ? "Fonte consultada: partida selecionada"
    : "Fonte consultada: posição selecionada";
}
