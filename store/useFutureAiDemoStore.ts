import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  FutureAiInteraction,
  ProfessorAnswerContent,
  ProfessorToolDecision,
} from "@/lib/future-ai/demo";
import { getSafeStorage, STORAGE_KEYS } from "@/lib/storage/storage";

interface FutureAiDemoStore { interactions: FutureAiInteraction[]; addInteraction: (interaction: FutureAiInteraction) => void; clearConversation: () => void; }
const timestamp = (value: string): number => { const parsed = Date.parse(value); return Number.isFinite(parsed) ? parsed : 0; };
export const sortInteractionsNewestFirst = (items: FutureAiInteraction[]): FutureAiInteraction[] => [...items].sort((a, b) => timestamp(b.createdAt) - timestamp(a.createdAt) || b.id.localeCompare(a.id));
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const strings = (value: unknown): string[] => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
const evidenceStatus = (value: unknown): ProfessorAnswerContent["evidenceStatus"] =>
  value === "sufficient" || value === "partial" ? value : "insufficient";
const toolDecision = (value: unknown): ProfessorToolDecision | null => {
  if (!isRecord(value)) return null;
  if (
    value.status === "called" &&
    (value.name === "get_game_context" || value.name === "get_position_context") &&
    value.callCount === 1 &&
    value.executionStatus === "completed"
  ) {
    return {
      status: "called",
      name: value.name,
      callCount: 1,
      executionStatus: "completed",
    };
  }
  if (
    value.status === "not_called" &&
    value.name === null &&
    value.callCount === 0 &&
    value.executionStatus === "not_executed"
  ) {
    return {
      status: "not_called",
      name: null,
      callCount: 0,
      executionStatus: "not_executed",
    };
  }
  return null;
};
const migrateAnswer = (
  answer: Record<string, unknown>,
  label: string,
): ProfessorAnswerContent => {
  const hasStructuredFields =
    Array.isArray(answer.studyRecommendations) &&
    Array.isArray(answer.limitations);
  if (hasStructuredFields) {
    return {
      summary: typeof answer.summary === "string" ? answer.summary : "Resposta do Professor IA.",
      observations: strings(answer.observations),
      strengths: strings(answer.strengths),
      improvements: strings(answer.improvements),
      studyRecommendations: strings(answer.studyRecommendations),
      evidenceUsed: strings(answer.evidenceUsed),
      limitations: strings(answer.limitations),
      evidenceStatus: evidenceStatus(answer.evidenceStatus),
    };
  }

  return {
    summary: typeof answer.summary === "string" ? answer.summary : "Resposta antiga da demonstração.",
    observations: strings(answer.observations),
    strengths: [],
    improvements: typeof answer.learning === "string" ? [answer.learning] : [],
    studyRecommendations: strings(answer.plan),
    evidenceUsed: [typeof answer.contextUsed === "string" ? answer.contextUsed : label],
    limitations: ["Conteúdo preservado do histórico simulado anterior à integração."],
    evidenceStatus: "insufficient",
  };
};
const migrateInteractions = (persisted: unknown): Pick<FutureAiDemoStore, "interactions"> => {
  if (!isRecord(persisted) || !Array.isArray(persisted.interactions)) return { interactions: [] };
  const interactions = persisted.interactions.filter(isRecord).map((item, index): FutureAiInteraction | null => {
    if (typeof item.question !== "string" || !isRecord(item.answer)) return null;
    const rawContext = isRecord(item.context) ? item.context : {};
    const rawType = typeof rawContext.type === "string" ? rawContext.type : "unknown";
    const current = rawType === "game-analysis" || rawType === "saved-position";
    const label = typeof rawContext.label === "string" && rawContext.label.trim() ? rawContext.label : "Contexto antigo da demonstração";
    const answer = item.answer;
    return { id: typeof item.id === "string" ? item.id : `legacy-${index}`, question: item.question, answer: migrateAnswer(answer, label), toolDecision: toolDecision(item.toolDecision), createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date(0).toISOString(), context: { type: rawType as FutureAiInteraction["context"]["type"], id: typeof rawContext.id === "string" ? rawContext.id : null, label: current ? label : "Contexto antigo da demonstração", legacy: !current } };
  }).filter((item): item is FutureAiInteraction => item !== null);
  return { interactions: sortInteractionsNewestFirst(interactions).slice(0, 30) };
};
export const useFutureAiDemoStore = create<FutureAiDemoStore>()(persist((set) => ({
  interactions: [],
  addInteraction: (interaction) => set((state) => ({ interactions: sortInteractionsNewestFirst([interaction, ...state.interactions]).slice(0, 30) })),
  clearConversation: () => set({ interactions: [] }),
}), { name: STORAGE_KEYS.futureAiDemo, version: 3, storage: createJSONStorage(getSafeStorage), skipHydration: true, partialize: ({ interactions }) => ({ interactions }), migrate: migrateInteractions, merge: (persisted, current) => ({ ...current, ...migrateInteractions(persisted) }) }));
export const hydrateFutureAiDemoStore = async (): Promise<void> => { await useFutureAiDemoStore.persist.rehydrate(); };
