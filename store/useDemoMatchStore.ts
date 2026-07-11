import { Chess } from "chess.js";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getSafeStorage, STORAGE_KEYS } from "@/lib/storage/storage";
import type { ChatMessage, DemoMatchConfig, DemoMove, MatchResult, PersistedDemoMatch } from "@/lib/types/play";
import type { PlayerColor } from "@/lib/types/chess";

const initialMessages: ChatMessage[] = [
  { id: "example-1", author: "Exemplo", text: "Boa partida!" },
  { id: "example-2", author: "Exemplo", text: "Bom lance." },
  { id: "example-3", author: "Exemplo", text: "Obrigado pela partida." },
];

interface DemoMatchStore {
  match: PersistedDemoMatch | null;
  hydrated: boolean;
  startMatch: (config: DemoMatchConfig) => void;
  updatePosition: (game: Chess, moves: DemoMove[], whiteMilliseconds: number, blackMilliseconds: number) => void;
  tickClock: (now?: number) => void;
  flipBoard: () => void;
  finishMatch: (result: MatchResult, now?: number) => void;
  restartMatch: () => void;
  addChatMessage: (text: string) => void;
  clearChat: () => void;
  setDrawOfferPending: (pending: boolean) => void;
  deleteMatch: () => void;
  markHydrated: () => void;
}

const turnColor = (game: Chess): PlayerColor => game.turn() === "w" ? "white" : "black";
const newSession = (config: DemoMatchConfig, now = Date.now()): PersistedDemoMatch => {
  const game = new Chess();
  const milliseconds = config.timeControl.minutes * 60_000;
  return { ...config, sessionId: `demo-${now}`, orientation: config.userColor, fen: game.fen(), pgn: game.pgn(), moves: [], turn: "white", lastMove: null, whiteMilliseconds: milliseconds, blackMilliseconds: milliseconds, increment: config.timeControl.increment * 1000, startedAt: now, lastClockUpdateAt: now, status: "playing", result: null, chatMessages: initialMessages, drawOfferPending: false };
};

function elapsedMatch(match: PersistedDemoMatch, now: number): PersistedDemoMatch {
  if (match.status === "finished" || match.result) return match;
  const elapsed = Math.max(0, now - match.lastClockUpdateAt);
  const key = match.turn === "white" ? "whiteMilliseconds" : "blackMilliseconds";
  const remaining = Math.max(0, match[key] - elapsed);
  if (remaining === 0) return { ...match, [key]: 0, lastClockUpdateAt: now, status: "finished", result: { winner: match.turn === "white" ? "black" : "white", reason: "timeout" } };
  return { ...match, [key]: remaining, lastClockUpdateAt: now };
}

export const useDemoMatchStore = create<DemoMatchStore>()(persist((set, get) => ({
  match: null, hydrated: false,
  startMatch: (config) => set({ match: newSession(config) }),
  updatePosition: (game, moves, whiteMilliseconds, blackMilliseconds) => set((state) => state.match ? { match: { ...state.match, fen: game.fen(), pgn: game.pgn(), moves, lastMove: moves.at(-1) ?? null, turn: turnColor(game), whiteMilliseconds, blackMilliseconds, lastClockUpdateAt: Date.now() } } : state),
  tickClock: (now = Date.now()) => set((state) => state.match ? { match: elapsedMatch(state.match, now) } : state),
  flipBoard: () => set((state) => state.match ? { match: { ...state.match, orientation: state.match.orientation === "white" ? "black" : "white" } } : state),
  finishMatch: (result, now = Date.now()) => set((state) => state.match ? { match: { ...elapsedMatch(state.match, now), status: "finished", result, lastClockUpdateAt: now, drawOfferPending: false } } : state),
  restartMatch: () => { const match = get().match; if (match) set({ match: newSession({ opponent: match.opponent, timeControl: match.timeControl, userColor: match.userColor }) }); },
  addChatMessage: (text) => set((state) => state.match ? { match: { ...state.match, chatMessages: [...state.match.chatMessages, { id: `local-${Date.now()}-${state.match.chatMessages.length}`, author: "Você", text: text.trim().slice(0, 160) }] } } : state),
  clearChat: () => set((state) => state.match ? { match: { ...state.match, chatMessages: [] } } : state),
  setDrawOfferPending: (pending) => set((state) => state.match ? { match: { ...state.match, drawOfferPending: pending } } : state),
  deleteMatch: () => set({ match: null }),
  markHydrated: () => { const match = get().match; set({ hydrated: true, match: match ? elapsedMatch(match, Date.now()) : null }); },
}), {
  name: STORAGE_KEYS.demoMatch, version: 1, storage: createJSONStorage(getSafeStorage), skipHydration: true,
  partialize: (state) => ({ match: state.match }),
  migrate: (persisted) => persisted as Pick<DemoMatchStore, "match">,
  onRehydrateStorage: () => (state) => state?.markHydrated(),
}));

export async function hydrateDemoMatchStore(): Promise<void> {
  await useDemoMatchStore.persist.rehydrate();
  const state = useDemoMatchStore.getState();
  if (!state.hydrated) state.markHydrated();
}
