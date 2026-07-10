import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mockRankingPlayers } from "@/lib/data/rankings";
import { getSafeStorage, STORAGE_KEYS } from "@/lib/storage/storage";
import type { RankingPlayer } from "@/lib/types/chess";
import { sortRankingPlayers } from "@/lib/utils/chess";

interface RankingStore {
  players: RankingPlayer[];
  getSortedPlayers: () => RankingPlayer[];
  getPlayerById: (id: string) => RankingPlayer | undefined;
  resetPlayers: () => void;
}

export const useRankingStore = create<RankingStore>()(persist((set, get) => ({
  players: mockRankingPlayers,
  getSortedPlayers: () => sortRankingPlayers(get().players),
  getPlayerById: (id) => get().players.find((player) => player.id === id),
  resetPlayers: () => set({ players: mockRankingPlayers }),
}), { name: STORAGE_KEYS.ranking, storage: createJSONStorage(getSafeStorage), skipHydration: true, partialize: (state) => ({ players: state.players }) }));

export const hydrateRankingStore = async (): Promise<void> => { await useRankingStore.persist.rehydrate(); };
