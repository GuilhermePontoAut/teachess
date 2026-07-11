import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mockGames } from "@/lib/data/games";
import { currentUser } from "@/lib/data/users";
import { getSafeStorage, STORAGE_KEYS } from "@/lib/storage/storage";
import type { AnalysisStatus, ChessGame } from "@/lib/types/chess";
import { canDeleteGame, canEditGameNotes } from "@/lib/utils/gameRules";

interface GameStore {
  games: ChessGame[];
  addGame: (game: ChessGame) => void;
  updateGameNotes: (id: string, notes: string, tags: string[]) => boolean;
  deleteGame: (id: string) => boolean;
  getGameById: (id: string) => ChessGame | undefined;
  resetGames: () => void;
  changeAnalysisStatus: (id: string, status: AnalysisStatus) => void;
}

type LegacyGame = Partial<ChessGame> & {
  id?: string;
  playerRating?: number;
  opponentRating?: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export function migrateGame(game: LegacyGame): ChessGame {
  const { playerRating, opponentRating, ...gameWithoutLegacyRatings } = game;
  const officialMock = mockGames.find((mock) => mock.id === game.id);
  const origin = game.origin ?? officialMock?.origin ?? "external";
  const now = new Date().toISOString();

  return {
    ...(officialMock ?? mockGames[0]),
    ...gameWithoutLegacyRatings,
    id: game.id ?? crypto.randomUUID(),
    origin,
    visibility: origin === "platform" ? "public" : "private",
    ownerUserId: game.ownerUserId ?? currentUser.id,
    playerUserId: game.playerUserId ?? currentUser.id,
    opponentUserId: origin === "platform" ? game.opponentUserId ?? officialMock?.opponentUserId : undefined,
    addedManually: origin === "external" ? true : game.addedManually ?? false,
    externalSource: origin === "external" ? game.externalSource ?? officialMock?.externalSource ?? "outro" : undefined,
    externalSourceDetails: origin === "external" ? game.externalSourceDetails ?? officialMock?.externalSourceDetails : undefined,
    playerRatingAtGame: game.playerRatingAtGame ?? playerRating ?? officialMock?.playerRatingAtGame ?? currentUser.currentPlatformRating,
    opponentRatingAtGame: game.opponentRatingAtGame ?? opponentRating ?? officialMock?.opponentRatingAtGame ?? currentUser.currentPlatformRating,
    createdAt: game.createdAt ?? now,
    updatedAt: game.updatedAt ?? game.createdAt ?? now,
  };
}

export function migratePersistedGameState(persistedState: unknown): { games: ChessGame[] } {
  if (!isRecord(persistedState) || !Array.isArray(persistedState.games)) return { games: mockGames };
  return { games: persistedState.games.filter(isRecord).map((game) => migrateGame(game as LegacyGame)) };
}

export const useGameStore = create<GameStore>()(persist((set, get) => ({
  games: mockGames,
  addGame: (game) => set((state) => ({ games: [game, ...state.games] })),
  updateGameNotes: (id, notes, tags) => {
    const game = get().games.find((item) => item.id === id);
    if (!game || !canEditGameNotes(currentUser, game)) return false;
    set((state) => ({ games: state.games.map((item) => item.id === id ? { ...item, notes, tags, updatedAt: new Date().toISOString() } : item) }));
    return true;
  },
  deleteGame: (id) => {
    const game = get().games.find((item) => item.id === id);
    if (!game || !canDeleteGame(currentUser, game)) return false;
    set((state) => ({ games: state.games.filter((item) => item.id !== id) }));
    return true;
  },
  getGameById: (id) => get().games.find((game) => game.id === id),
  resetGames: () => set({ games: mockGames }),
  changeAnalysisStatus: (id, status) => set((state) => ({ games: state.games.map((game) => game.id === id ? { ...game, analysisStatus: status, updatedAt: new Date().toISOString() } : game) })),
}), {
  name: STORAGE_KEYS.games,
  version: 2,
  migrate: migratePersistedGameState,
  storage: createJSONStorage(getSafeStorage),
  skipHydration: true,
  partialize: (state) => ({ games: state.games }),
}));

export const hydrateGameStore = async (): Promise<void> => { await useGameStore.persist.rehydrate(); };
