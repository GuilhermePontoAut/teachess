import type { PlayerColor, RankingPlayer } from "@/lib/types/chess";

export type DemoPresence = "available" | "playing" | "away";
export type DemoColorChoice = PlayerColor | "random";
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
}

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
