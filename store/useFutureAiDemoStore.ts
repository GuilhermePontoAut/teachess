import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  AnalysisJob,
  AnalysisResult,
  AnalysisTarget,
  PositionAnalysisResult,
} from "@/lib/analysis/contracts";
import { getSafeStorage, STORAGE_KEYS } from "@/lib/storage/storage";

export type AnalysisSelectionType = "game" | "position";

type FutureAiAnalysisState = {
  analysisType: AnalysisSelectionType;
  selectedGameId: string | null;
  selectedPositionId: string | null;
  currentJob: AnalysisJob | null;
  lastResult: AnalysisResult | null;
  error: string | null;
};

interface FutureAiDemoStore extends FutureAiAnalysisState {
  selectAnalysisType: (type: AnalysisSelectionType) => void;
  selectGame: (gameId: string | null) => void;
  selectPosition: (positionId: string | null) => void;
  setCurrentJob: (job: AnalysisJob | null) => void;
  setLastResult: (result: AnalysisResult | null) => void;
  setError: (error: string | null) => void;
}

const initialState: FutureAiAnalysisState = {
  analysisType: "game",
  selectedGameId: null,
  selectedPositionId: null,
  currentJob: null,
  lastResult: null,
  error: null,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const selectionType = (value: unknown): AnalysisSelectionType =>
  value === "position" || value === "saved-position" ? "position" : "game";

const safeId = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value : null;

const safeTarget = (value: unknown): AnalysisTarget | null => {
  if (!isRecord(value)) return null;
  if (value.type === "game") {
    const gameId = safeId(value.gameId);
    return gameId ? { type: "game", gameId } : null;
  }
  if (value.type === "position") {
    const positionId = safeId(value.positionId);
    return positionId
      ? {
          type: "position",
          positionId,
          fen: typeof value.fen === "string" ? value.fen : null,
        }
      : null;
  }
  return null;
};

const safeResult = (value: unknown): AnalysisResult | null => {
  if (!isRecord(value) || value.status !== "completed") return null;
  const target = safeTarget(value.target);
  if (
    target?.type === "position" &&
    value.isDemonstration === false &&
    isRecord(value.analysis) &&
    typeof value.analysis.fen === "string" &&
    (value.analysis.sideToMove === "white" || value.analysis.sideToMove === "black") &&
    isRecord(value.analysis.engineSettings) &&
    value.analysis.engineSettings.engine === "stockfish" &&
    Array.isArray(value.analysis.principalVariations) &&
    typeof value.jobId === "string" &&
    typeof value.completedAt === "string"
  ) {
    return value as PositionAnalysisResult;
  }
  if (
    !target ||
    typeof value.jobId !== "string" ||
    typeof value.message !== "string" ||
    typeof value.completedAt !== "string" ||
    value.isDemonstration !== true
  ) {
    return null;
  }
  return {
    jobId: value.jobId,
    target,
    status: "completed",
    message: value.message,
    completedAt: value.completedAt,
    isDemonstration: true,
  };
};

const sanitizedError = (value: unknown): string | null =>
  typeof value === "string" && value.trim()
    ? value.replace(/https?:\/\/\S+/gi, "[endereço removido]").slice(0, 240)
    : null;

export function migrateFutureAiAnalysisState(
  persisted: unknown,
): FutureAiAnalysisState {
  if (!isRecord(persisted)) return { ...initialState };

  const analysisType = selectionType(
    persisted.analysisType ?? (isRecord(persisted.context) ? persisted.context.type : null),
  );
  const legacyContext = isRecord(persisted.context) ? persisted.context : null;
  const selectedGameId =
    safeId(persisted.selectedGameId) ??
    (legacyContext?.type === "game-analysis" ? safeId(legacyContext.id) : null);
  const selectedPositionId =
    safeId(persisted.selectedPositionId) ??
    (legacyContext?.type === "saved-position" ? safeId(legacyContext.id) : null);
  const currentJob = isRecord(persisted.currentJob)
    ? (() => {
        const target = safeTarget(persisted.currentJob.target);
        const status = persisted.currentJob.status;
        if (
          !target ||
          (status !== "idle" &&
            status !== "completed" &&
            status !== "cancelled" &&
            status !== "failed") ||
          typeof persisted.currentJob.id !== "string" ||
          typeof persisted.currentJob.createdAt !== "string" ||
          typeof persisted.currentJob.updatedAt !== "string"
        ) {
          return null;
        }
        return {
          id: persisted.currentJob.id,
          target,
          status,
          createdAt: persisted.currentJob.createdAt,
          updatedAt: persisted.currentJob.updatedAt,
          error: sanitizedError(persisted.currentJob.error),
        } satisfies AnalysisJob;
      })()
    : null;

  return {
    analysisType,
    selectedGameId,
    selectedPositionId,
    currentJob,
    lastResult: safeResult(persisted.lastResult),
    error: sanitizedError(persisted.error),
  };
}

export const useFutureAiDemoStore = create<FutureAiDemoStore>()(
  persist(
    (set) => ({
      ...initialState,
      selectAnalysisType: (analysisType) =>
        set({ analysisType, currentJob: null, lastResult: null, error: null }),
      selectGame: (selectedGameId) =>
        set({ selectedGameId, currentJob: null, lastResult: null, error: null }),
      selectPosition: (selectedPositionId) =>
        set({ selectedPositionId, currentJob: null, lastResult: null, error: null }),
      setCurrentJob: (currentJob) => set({ currentJob }),
      setLastResult: (lastResult) => set({ lastResult }),
      setError: (error) => set({ error: sanitizedError(error) }),
    }),
    {
      name: STORAGE_KEYS.futureAiDemo,
      version: 5,
      storage: createJSONStorage(getSafeStorage),
      skipHydration: true,
      partialize: ({
        analysisType,
        selectedGameId,
        selectedPositionId,
        currentJob,
        lastResult,
        error,
      }) => ({
        analysisType,
        selectedGameId,
        selectedPositionId,
        currentJob:
          currentJob?.status === "preparing" || currentJob?.status === "analyzing"
            ? null
            : currentJob,
        lastResult,
        error,
      }),
      migrate: migrateFutureAiAnalysisState,
      merge: (persisted, current) => ({
        ...current,
        ...migrateFutureAiAnalysisState(persisted),
      }),
    },
  ),
);

export const hydrateFutureAiDemoStore = async (): Promise<void> => {
  await useFutureAiDemoStore.persist.rehydrate();
};
