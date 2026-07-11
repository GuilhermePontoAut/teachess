import type { PlayerColor, RankingPlayer } from "@/lib/types/chess";

export type DemoPresence = "available" | "playing" | "away";
export type DemoColorChoice = PlayerColor | "random";
export type RatingRangeOption = "100" | "200" | "400" | "unlimited";
export type OpenRoomStatus = "open" | "occupied" | "cancelled";
export type MatchPhase = "playing" | "finished";
export type MatchReason = "checkmate" | "stalemate" | "insufficient" | "repetition" | "fifty-move" | "draw-agreement" | "resignation" | "timeout";

export interface TimeControl {
  id: string;
  minutes: number;
  increment: number;
  category: "Bullet" | "Blitz" | "Rápida";
}

export interface AvailablePlayer extends RankingPlayer {
  presence: DemoPresence;
  preferredTime: string;
  incomingChallengeRange: { minDelta: number; maxDelta: number };
}

export interface OpenMatchRoom {
  id: string; creatorPlayerId: string; creatorName: string; creatorRating: number;
  region: string; timeControl: TimeControl; category: TimeControl["category"];
  colorPreference: DemoColorChoice; minRating: number; maxRating: number;
  createdAt: string; status: OpenRoomStatus; isDemo: true; isOwn?: boolean;
}

export interface ChatMessage { id: string; author: string; text: string }

export interface DemoMove {
  san: string;
  from: string;
  to: string;
  color: "w" | "b";
}

export interface MatchResult {
  winner: PlayerColor | null;
  reason: MatchReason;
}

export interface DemoMatchConfig {
  opponent: AvailablePlayer;
  timeControl: TimeControl;
  userColor: PlayerColor;
}

export interface PersistedDemoMatch extends DemoMatchConfig {
  sessionId: string; orientation: PlayerColor; fen: string; pgn: string; moves: DemoMove[];
  turn: PlayerColor; lastMove: DemoMove | null; whiteMilliseconds: number; blackMilliseconds: number;
  increment: number; startedAt: number; lastClockUpdateAt: number; status: MatchPhase;
  result: MatchResult | null; chatMessages: ChatMessage[]; drawOfferPending: boolean;
}
