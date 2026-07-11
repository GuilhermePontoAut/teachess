import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mockTrainingTopics } from "@/lib/data/training";
import { mockAnalyses } from "@/lib/data/analyses";
import { mockRecommendations } from "@/lib/data/recommendations";
import { mockGames } from "@/lib/data/games";
import { getSafeStorage, STORAGE_KEYS } from "@/lib/storage/storage";
import { createExercises, createInitialPlan, deriveRecommendations, type CompletionEntry, type ExerciseProgress, type TrainingActivity } from "@/components/training/training";

interface TrainingState {
  weeklyPlan: TrainingActivity[];
  exerciseProgress: Record<string, ExerciseProgress>;
  topicProgress: Record<string, number>;
  completionHistory: CompletionEntry[];
  addedTopicIds: string[];
  lastUpdatedAt: string | null;
  toggleActivityCompletion: (id: string) => void;
  addTopicToPlan: (topicId: string, title: string, minutes: number, reason: string) => boolean;
  startExercise: (id: string) => void;
  setExerciseProgress: (id: string, progress: number) => void;
  completeExercise: (id: string) => void;
  resetExercise: (id: string) => void;
  resetTrainingProgress: () => void;
}

const initialPlan = createInitialPlan(deriveRecommendations(mockTrainingTopics, mockAnalyses, mockRecommendations, mockGames));
const exercises = createExercises(mockTrainingTopics);
const initialTopicProgress = Object.fromEntries(mockTrainingTopics.map((topic) => [topic.id, topic.progress]));
const initialExerciseProgress = Object.fromEntries(exercises.map((exercise) => [exercise.id, { status: "not_started", progress: 0, completedAt: null } satisfies ExerciseProgress]));
const initialState = () => ({ weeklyPlan: initialPlan, exerciseProgress: initialExerciseProgress, topicProgress: initialTopicProgress, completionHistory: [] as CompletionEntry[], addedTopicIds: initialPlan.map((item) => item.topicId), lastUpdatedAt: null as string | null });

const updateTopicFromWork = (progress: Record<string, number>, topicId: string, amount: number) => ({ ...progress, [topicId]: Math.min(100, Math.max(progress[topicId] ?? 0, amount)) });

export const useTrainingStore = create<TrainingState>()(persist((set, get) => ({
  ...initialState(),
  toggleActivityCompletion: (id) => set((state) => {
    const activity = state.weeklyPlan.find((item) => item.id === id); if (!activity) return state;
    const completedAt = activity.completedAt ? null : new Date().toISOString();
    return { weeklyPlan: state.weeklyPlan.map((item) => item.id === id ? { ...item, completedAt } : item), completionHistory: completedAt ? [{ id: `history-activity-${id}`, kind: "activity", title: activity.title, topicId: activity.topicId, completedAt, minutes: activity.estimatedMinutes }, ...state.completionHistory.filter((item) => item.id !== `history-activity-${id}`)] : state.completionHistory.filter((item) => item.id !== `history-activity-${id}`), topicProgress: completedAt ? updateTopicFromWork(state.topicProgress, activity.topicId, 75) : state.topicProgress, lastUpdatedAt: new Date().toISOString() };
  }),
  addTopicToPlan: (topicId, title, minutes, reason) => { if (get().addedTopicIds.includes(topicId)) return false; set((state) => ({ weeklyPlan: [...state.weeklyPlan, { id: `added-${topicId}`, day: "Sessão extra", title: "Estudar tema adicionado", topicId, topicTitle: title, type: "study", estimatedMinutes: minutes, priority: "medium", reason, completedAt: null }], addedTopicIds: [...state.addedTopicIds, topicId], lastUpdatedAt: new Date().toISOString() })); return true; },
  startExercise: (id) => set((state) => ({ exerciseProgress: { ...state.exerciseProgress, [id]: { status: "in_progress", progress: Math.max(10, state.exerciseProgress[id]?.progress ?? 0), completedAt: null } }, lastUpdatedAt: new Date().toISOString() })),
  setExerciseProgress: (id, progress) => set((state) => ({ exerciseProgress: { ...state.exerciseProgress, [id]: { status: progress >= 100 ? "completed" : "in_progress", progress: Math.min(100, progress), completedAt: progress >= 100 ? new Date().toISOString() : null } }, lastUpdatedAt: new Date().toISOString() })),
  completeExercise: (id) => set((state) => { const exercise = exercises.find((item) => item.id === id); if (!exercise) return state; const completedAt = new Date().toISOString(); return { exerciseProgress: { ...state.exerciseProgress, [id]: { status: "completed", progress: 100, completedAt } }, topicProgress: updateTopicFromWork(state.topicProgress, exercise.topicId, 100), completionHistory: [{ id: `history-exercise-${id}`, kind: "exercise", title: exercise.title, topicId: exercise.topicId, completedAt, minutes: exercise.estimatedMinutes }, ...state.completionHistory.filter((item) => item.id !== `history-exercise-${id}`)], lastUpdatedAt: completedAt }; }),
  resetExercise: (id) => set((state) => ({ exerciseProgress: { ...state.exerciseProgress, [id]: { status: "not_started", progress: 0, completedAt: null } }, completionHistory: state.completionHistory.filter((item) => item.id !== `history-exercise-${id}`), lastUpdatedAt: new Date().toISOString() })),
  resetTrainingProgress: () => set(initialState()),
}), { name: STORAGE_KEYS.training, version: 1, storage: createJSONStorage(getSafeStorage), skipHydration: true, partialize: ({ weeklyPlan, exerciseProgress, topicProgress, completionHistory, addedTopicIds, lastUpdatedAt }) => ({ weeklyPlan, exerciseProgress, topicProgress, completionHistory, addedTopicIds, lastUpdatedAt }), migrate: (persisted) => persisted as TrainingState }));

export const hydrateTrainingStore = async (): Promise<void> => { await useTrainingStore.persist.rehydrate(); };
