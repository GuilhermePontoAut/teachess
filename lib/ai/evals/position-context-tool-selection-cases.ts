import type { AutoPositionContextToolFlowResult } from "../tools/auto-position-context-tool-flow";

export const POSITION_CONTEXT_TOOL_SELECTION_EVAL_SET_VERSION =
  "position-context-tool-selection-evals-v1" as const;

export type PositionContextToolSelectionExpectedDecision =
  AutoPositionContextToolFlowResult["toolSelection"]["decision"];

export type PositionContextToolSelectionEvalCase = {
  id: `AUTO-SEL-00${1 | 2 | 3 | 4 | 5 | 6}`;
  message: string;
  expectedDecision: PositionContextToolSelectionExpectedDecision;
  rationale: string;
  prohibitedBehaviors: readonly string[];
  status: "not_executed";
};

export const positionContextToolSelectionCases = [
  {
    id: "AUTO-SEL-001",
    message: "Qual é o lado a mover na posição selecionada?",
    expectedDecision: "called",
    rationale:
      "A resposta depende de um fato derivado do FEN da posição autorizada.",
    prohibitedBehaviors: [
      "Responder qual lado move sem consultar o contexto autorizado.",
      "Inventar ou solicitar outro positionContextId.",
    ],
    status: "not_executed",
  },
  {
    id: "AUTO-SEL-002",
    message:
      "A posição selecionada está confirmada e possui dados suficientes para análise?",
    expectedDecision: "called",
    rationale:
      "Confirmação e suficiência são estados exclusivos do snapshot autorizado e do runtime determinístico.",
    prohibitedBehaviors: [
      "Inferir confirmação pela mensagem do usuário.",
      "Declarar suficiência sem consultar a Tool.",
    ],
    status: "not_executed",
  },
  {
    id: "AUTO-SEL-003",
    message:
      "Analise somente os fatos disponíveis sobre a posição selecionada e explique as limitações.",
    expectedDecision: "called",
    rationale:
      "Fatos e limitações da posição selecionada precisam ser recuperados do único snapshot autorizado.",
    prohibitedBehaviors: [
      "Inventar fatos ausentes da posição.",
      "Produzir avaliação de engine, melhor lance ou variante.",
    ],
    status: "not_executed",
  },
  {
    id: "AUTO-SEL-004",
    message: "Qual é a melhor abertura de xadrez para todos os jogadores?",
    expectedDecision: "not_called",
    rationale:
      "A pergunta é geral e fora do escopo restrito; os fatos da posição selecionada não ajudam a respondê-la.",
    prohibitedBehaviors: [
      "Chamar get_position_context sem necessidade.",
      "Recomendar uma abertura universal como fato.",
    ],
    status: "not_executed",
  },
  {
    id: "AUTO-SEL-005",
    message: "Olá, tudo bem?",
    expectedDecision: "not_called",
    rationale:
      "Uma saudação não depende de nenhum fato da posição selecionada.",
    prohibitedBehaviors: [
      "Chamar get_position_context para responder à saudação.",
      "Expor dados ou identificadores da posição sem necessidade.",
    ],
    status: "not_executed",
  },
  {
    id: "AUTO-SEL-006",
    message: "Explique de forma geral o que é o roque.",
    expectedDecision: "not_called",
    rationale:
      "A explicação conceitual geral não depende dos fatos da posição selecionada.",
    prohibitedBehaviors: [
      "Chamar get_position_context sem dependência da posição.",
      "Apresentar a posição selecionada como exemplo sem necessidade.",
    ],
    status: "not_executed",
  },
] as const satisfies readonly PositionContextToolSelectionEvalCase[];
