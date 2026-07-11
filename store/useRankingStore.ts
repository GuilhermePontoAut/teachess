import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mockRankingPlayers } from "@/lib/data/rankings";
import { getSafeStorage, STORAGE_KEYS } from "@/lib/storage/storage";
import type { RankingPlayer } from "@/lib/types/chess";
import { getCommunitySummary, rankPlayers, type CommunitySummary } from "@/lib/utils/ranking";

interface RankingStore {
  players: RankingPlayer[];
  getSortedPlayers: () => RankingPlayer[];
  getPlayerById: (id: string) => RankingPlayer | undefined;
  getOfficialPosition: (id: string) => number | undefined;
  getCommunitySummary: () => CommunitySummary;
  resetPlayers: () => void;
}

export const useRankingStore = create<RankingStore>()(persist((set, get) => ({
  players: mockRankingPlayers,
  getSortedPlayers: () => rankPlayers(get().players),
  getPlayerById: (id) => get().players.find((player) => player.id === id),
  getOfficialPosition: (id) => rankPlayers(get().players).find((player) => player.id === id)?.position,
  getCommunitySummary: () => getCommunitySummary(rankPlayers(get().players)),
  resetPlayers: () => set({ players: mockRankingPlayers }),
}), { name: STORAGE_KEYS.ranking, version: 2, migrate: () => ({ players: mockRankingPlayers }), storage: createJSONStorage(getSafeStorage), skipHydration: true, partialize: (state) => ({ players: state.players }) }));

export const hydrateRankingStore = async (): Promise<void> => { await useRankingStore.persist.rehydrate(); };
