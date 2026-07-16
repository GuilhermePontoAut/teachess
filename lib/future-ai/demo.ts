import type { ChessGame, GameAnalysis, TrainingTopic, UploadedPosition } from "@/lib/types/chess";

export type FutureAiContextType = "game-analysis" | "saved-position";
export type LegacyFutureAiContextType = "game" | "analysis" | "position" | "training" | "none" | "no-context" | "unknown";
export type FutureAiTab = "professor" | "capabilities" | "architecture" | "roadmap";

export interface FutureAiContextRef { type: FutureAiContextType | LegacyFutureAiContextType; id: string | null; label: string; legacy?: boolean; }
export interface ProfessorAnswerContent {
  summary: string;
  observations: string[];
  strengths: string[];
  improvements: string[];
  studyRecommendations: string[];
  evidenceUsed: string[];
  limitations: string[];
  evidenceStatus: "sufficient" | "partial" | "insufficient";
}
export type ProfessorToolDecision =
  | {
      status: "called";
      name: "get_game_context" | "get_position_context";
      callCount: 1;
      executionStatus: "completed";
    }
  | {
      status: "not_called";
      name: null;
      callCount: 0;
      executionStatus: "not_executed";
    };
export interface FutureAiInteraction { id: string; question: string; context: FutureAiContextRef; answer: ProfessorAnswerContent; toolDecision: ProfessorToolDecision | null; createdAt: string; }
export interface DemoContextData { game?: ChessGame; analysis?: GameAnalysis; position?: UploadedPosition; training?: TrainingTopic & { progress: number }; }

export const contextTypeLabels: Record<FutureAiContextType, string> = { "game-analysis": "Análise de partida", "saved-position": "Posição específica" };
export const errorCategoryLabels = { opening: "Abertura", tactics: "Tática", strategy: "Estratégia", time_management: "Gestão do tempo", calculation: "Cálculo", endgame: "Final" } as const;

const questions: Record<FutureAiContextType, string[]> = {
  "game-analysis": ["Onde comecei a perder vantagem?", "Qual foi meu principal erro?", "O que fiz bem nesta partida?", "Que tema devo estudar?", "Explique esta partida para um iniciante."],
  "saved-position": ["Quais são os planos desta posição?", "Quais peças estão mal posicionadas?", "Existe alguma ameaça imediata?", "O que devo analisar antes de jogar?", "Como um professor explicaria esta posição?"],
};
export const getSuggestedQuestions = (type: FutureAiContextType): string[] => questions[type];
