import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mockGames } from "@/lib/data/games";
import { getSafeStorage, STORAGE_KEYS } from "@/lib/storage/storage";
import type { AnalysisStatus, ChessGame } from "@/lib/types/chess";

interface GameStore {
  games: ChessGame[];
  addGame: (game: ChessGame) => void;
  updateGame: (id: string, changes: Partial<Omit<ChessGame, "id" | "createdAt">>) => void;
  deleteGame: (id: string) => void;
  getGameById: (id: string) => ChessGame | undefined;
  resetGames: () => void;
  changeAnalysisStatus: (id: string, status: AnalysisStatus) => void;
}

export const useGameStore = create<GameStore>()(persist((set, get) => ({
  games: mockGames,
  addGame: (game) => set((state) => ({ games: [game, ...state.games] })),
  updateGame: (id, changes) => set((state) => ({ games: state.games.map((game) => game.id === id ? { ...game, ...changes, updatedAt: new Date().toISOString() } : game) })),
  deleteGame: (id) => set((state) => ({ games: state.games.filter((game) => game.id !== id) })),
  getGameById: (id) => get().games.find((game) => game.id === id),
  resetGames: () => set({ games: mockGames }),
  changeAnalysisStatus: (id, status) => set((state) => ({ games: state.games.map((game) => game.id === id ? { ...game, analysisStatus: status, updatedAt: new Date().toISOString() } : game) })),
}), { name: STORAGE_KEYS.games, storage: createJSONStorage(getSafeStorage), skipHydration: true, partialize: (state) => ({ games: state.games }) }));

export const hydrateGameStore = async (): Promise<void> => { await useGameStore.persist.rehydrate(); };
