import { Chess } from "chess.js";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getSafeStorage, STORAGE_KEYS } from "@/lib/storage/storage";
import type { ChatMessage, ChatSender, DemoMatchConfig, DemoMatchResultSummary, DemoMove, MatchResult, PersistedDemoMatch, StartMatchResult } from "@/lib/types/play";
import type { PlayerColor } from "@/lib/types/chess";

interface DemoMatchStore {
  activeMatch: PersistedDemoMatch | null;
  lastDemoResult: DemoMatchResultSummary | null;
  hydrated: boolean;
  startMatch: (config: DemoMatchConfig) => StartMatchResult;
  updatePosition: (game: Chess, moves: DemoMove[], whiteMilliseconds: number, blackMilliseconds: number) => void;
  tickClock: (now?: number) => void;
  flipBoard: () => void;
  finishMatch: (result: MatchResult, now?: number) => void;
  restartMatch: () => void;
  addChatMessage: (text: string, sender?: ChatSender) => void;
  setDrawOfferPending: (pending: boolean) => void;
  deleteMatch: () => void;
  dismissResult: () => void;
  markHydrated: () => void;
}

const turnColor = (game: Chess): PlayerColor => game.turn() === "w" ? "white" : "black";
const newSession = (config: DemoMatchConfig, now = Date.now()): PersistedDemoMatch => {
  const game = new Chess();
  const milliseconds = config.timeControl.minutes * 60_000;
  return { ...config, sessionId: `demo-${now}`, orientation: config.userColor, fen: game.fen(), pgn: game.pgn(), moves: [], turn: "white", lastMove: null, whiteMilliseconds: milliseconds, blackMilliseconds: milliseconds, increment: config.timeControl.increment * 1000, startedAt: now, lastClockUpdateAt: now, status: "playing", result: null, chatMessages: [], drawOfferPending: false };
};

export const isPlayableMatch = (match: PersistedDemoMatch | null): match is PersistedDemoMatch => Boolean(match && match.status === "playing" && !match.result);
export const hasActiveMatch = (state: Pick<DemoMatchStore, "activeMatch">): boolean => isPlayableMatch(state.activeMatch);

function persistedActiveMatch(): PersistedDemoMatch | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.demoMatch);
    if (!raw) return null;
    const stored = JSON.parse(raw) as { state?: { activeMatch?: PersistedDemoMatch | null } };
    return isPlayableMatch(stored.state?.activeMatch ?? null) ? stored.state?.activeMatch ?? null : null;
  } catch {
    return null;
  }
}

function elapsedMatch(match: PersistedDemoMatch, now: number): PersistedDemoMatch {
  if (!isPlayableMatch(match)) return match;
  const elapsed = Math.max(0, now - match.lastClockUpdateAt);
  const key = match.turn === "white" ? "whiteMilliseconds" : "blackMilliseconds";
  const remaining = Math.max(0, match[key] - elapsed);
  if (remaining === 0) return { ...match, [key]: 0, lastClockUpdateAt: now };
  return { ...match, [key]: remaining, lastClockUpdateAt: now };
}

export const useDemoMatchStore = create<DemoMatchStore>()(persist((set, get) => ({
  activeMatch: null, lastDemoResult: null, hydrated: false,
  startMatch: (config) => {
    const state = get();
    if (!state.hydrated) return { success: false, reason: "not-hydrated" };
    const storedMatch = persistedActiveMatch();
    if (isPlayableMatch(state.activeMatch) || storedMatch) {
      if (!isPlayableMatch(state.activeMatch) && storedMatch) set({ activeMatch: storedMatch });
      return { success: false, reason: "active-match-exists" };
    }
    set({ activeMatch: newSession(config), lastDemoResult: null });
    return { success: true };
  },
  updatePosition: (game, moves, whiteMilliseconds, blackMilliseconds) => set((state) => state.activeMatch ? { activeMatch: { ...state.activeMatch, fen: game.fen(), pgn: game.pgn(), moves, lastMove: moves.at(-1) ?? null, turn: turnColor(game), whiteMilliseconds, blackMilliseconds, lastClockUpdateAt: Date.now() } } : state),
  tickClock: (now = Date.now()) => {
    const match = get().activeMatch;
    if (!match) return;
    const elapsed = elapsedMatch(match, now);
    const remaining = elapsed.turn === "white" ? elapsed.whiteMilliseconds : elapsed.blackMilliseconds;
    if (remaining === 0) get().finishMatch({ winner: elapsed.turn === "white" ? "black" : "white", reason: "timeout" }, now);
    else set({ activeMatch: elapsed });
  },
  flipBoard: () => set((state) => state.activeMatch ? { activeMatch: { ...state.activeMatch, orientation: state.activeMatch.orientation === "white" ? "black" : "white" } } : state),
  finishMatch: (result, now = Date.now()) => set((state) => {
    if (!state.activeMatch) return state;
    const match = elapsedMatch(state.activeMatch, now);
    return { activeMatch: null, lastDemoResult: { opponent: match.opponent, timeControl: match.timeControl, userColor: match.userColor, result, moveCount: Math.ceil(match.moves.length / 2), durationSeconds: Math.max(0, Math.floor((now - match.startedAt) / 1000)), finishedAt: now } };
  }),
  restartMatch: () => { const match = get().activeMatch; if (isPlayableMatch(match)) set({ activeMatch: newSession({ opponent: match.opponent, timeControl: match.timeControl, userColor: match.userColor }) }); },
  addChatMessage: (text, sender = "self") => set((state) => {
    const clean = text.trim().slice(0, 160);
    if (!state.activeMatch || !clean) return state;
    const createdAt = Date.now();
    const message: ChatMessage = { id: `local-${createdAt}-${state.activeMatch.chatMessages.length}`, sender, text: clean, createdAt };
    return { activeMatch: { ...state.activeMatch, chatMessages: [...state.activeMatch.chatMessages, message] } };
  }),
  setDrawOfferPending: (pending) => set((state) => state.activeMatch ? { activeMatch: { ...state.activeMatch, drawOfferPending: pending } } : state),
  deleteMatch: () => set({ activeMatch: null, lastDemoResult: null }),
  dismissResult: () => set({ lastDemoResult: null }),
  markHydrated: () => {
    const match = get().activeMatch;
    if (!isPlayableMatch(match)) { set({ hydrated: true, activeMatch: null }); return; }
    const elapsed = elapsedMatch(match, Date.now());
    set({ hydrated: true, activeMatch: elapsed });
    const remaining = elapsed.turn === "white" ? elapsed.whiteMilliseconds : elapsed.blackMilliseconds;
    if (remaining === 0) get().finishMatch({ winner: elapsed.turn === "white" ? "black" : "white", reason: "timeout" });
  },
}), {
  name: STORAGE_KEYS.demoMatch, version: 2, storage: createJSONStorage(getSafeStorage), skipHydration: true,
  partialize: (state) => ({ activeMatch: state.activeMatch, lastDemoResult: state.lastDemoResult }),
  migrate: (persisted, version) => {
    const previous = persisted as { match?: PersistedDemoMatch | null; activeMatch?: PersistedDemoMatch | null; lastDemoResult?: DemoMatchResultSummary | null };
    const candidate = version < 2 ? previous.match : previous.activeMatch;
    if (!candidate || !isPlayableMatch(candidate)) return { activeMatch: null, lastDemoResult: null };
    const chatMessages = candidate.chatMessages.flatMap((message) => {
      const legacy = message as ChatMessage & { author?: string; createdAt?: number };
      if (legacy.id.startsWith("example-") || legacy.author === "Exemplo") return [];
      return [{ id: legacy.id, sender: legacy.sender ?? (legacy.author === "Você" ? "self" : "system"), text: legacy.text, createdAt: legacy.createdAt ?? candidate.startedAt } satisfies ChatMessage];
    });
    return { activeMatch: { ...candidate, orientation: candidate.orientation ?? candidate.userColor, chatMessages, status: "playing", result: null }, lastDemoResult: null };
  },
  onRehydrateStorage: () => (state) => state?.markHydrated(),
}));

export async function hydrateDemoMatchStore(): Promise<void> {
  await useDemoMatchStore.persist.rehydrate();
  const state = useDemoMatchStore.getState();
  if (!state.hydrated) state.markHydrated();
}

// A garantia real de uma única partida ativa deverá ser validada pelo backend. A sincronização local serve apenas ao protótipo.
export function subscribeToDemoMatchStorage(onSync?: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEYS.demoMatch) return;
    void Promise.resolve(useDemoMatchStore.persist.rehydrate()).then(onSync);
  };
  window.addEventListener("storage", handleStorage);
  return () => window.removeEventListener("storage", handleStorage);
}
