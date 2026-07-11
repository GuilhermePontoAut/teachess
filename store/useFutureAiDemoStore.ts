import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { FutureAiInteraction } from "@/lib/future-ai/demo";
import { getSafeStorage, STORAGE_KEYS } from "@/lib/storage/storage";

interface FutureAiDemoStore { interactions: FutureAiInteraction[]; addInteraction: (interaction: FutureAiInteraction) => void; clearConversation: () => void; }
export const useFutureAiDemoStore = create<FutureAiDemoStore>()(persist((set) => ({
  interactions: [],
  addInteraction: (interaction) => set((state) => ({ interactions: [...state.interactions, interaction].slice(-30) })),
  clearConversation: () => set({ interactions: [] }),
}), { name: STORAGE_KEYS.futureAiDemo, version: 1, storage: createJSONStorage(getSafeStorage), skipHydration: true, partialize: ({ interactions }) => ({ interactions }), migrate: (persisted) => persisted as Pick<FutureAiDemoStore, "interactions"> }));
export const hydrateFutureAiDemoStore = async (): Promise<void> => { await useFutureAiDemoStore.persist.rehydrate(); };
