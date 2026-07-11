import type { StateStorage } from "zustand/middleware";

const memoryStorage = new Map<string, string>();

const serverStorage: StateStorage = {
  getItem: (name) => memoryStorage.get(name) ?? null,
  setItem: (name, value) => { memoryStorage.set(name, value); },
  removeItem: (name) => { memoryStorage.delete(name); },
};

export const getSafeStorage = (): StateStorage =>
  typeof window === "undefined" ? serverStorage : window.localStorage;

export const STORAGE_KEYS = {
  games: "teachess-games-v1",
  uploads: "teachess-uploads-v1",
  ranking: "teachess-ranking-v1",
  preferences: "teachess-preferences-v1",
  training: "teachess-training-v1",
  demoMatch: "teachess-demo-match-v1",
  futureAiDemo: "teachess-future-ai-demo-v1",
} as const;
