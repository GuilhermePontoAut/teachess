import type { PedagogicalLevel } from "./pedagogical-profile";

export type AnalysisTarget =
  | { type: "game"; gameId: string }
  | { type: "position"; positionId: string; fen: string | null };

export type AnalysisJobStatus =
  | "idle"
  | "preparing"
  | "analyzing"
  | "completed"
  | "cancelled"
  | "failed";

export type ChessColor = "white" | "black";
export type MoveClassification =
  | "best"
  | "excellent"
  | "good"
  | "inaccuracy"
  | "mistake"
  | "blunder"
  | "unknown";

export type EngineSettings = {
  engine: "stockfish";
  engineVersion: string;
  depth?: number;
  moveTimeMs?: number;
  multiPv: number;
  threads?: number;
  hashMb?: number;
};

export type PrincipalVariation = {
  rank: number;
  evaluation: number | null;
  mateIn: number | null;
  moves: string[];
};

export type PositionEngineAnalysis = {
  fen: string;
  moveNumber: number;
  sideToMove: ChessColor;
  bestMove: string | null;
  evaluation: number | null;
  mateIn: number | null;
  principalVariations: PrincipalVariation[];
  engineSettings: EngineSettings;
};

export type CriticalMoment = {
  fenBefore: string;
  moveNumber: number;
  sidePlayed: ChessColor;
  playedMove: string;
  bestMove: string | null;
  evaluationBefore: number | null;
  evaluationAfter: number | null;
  evaluationLoss: number | null;
  classification: MoveClassification;
  principalVariations: PrincipalVariation[];
};

export type GameAnalysis = {
  target: Extract<AnalysisTarget, { type: "game" }>;
  status: AnalysisJobStatus;
  engineSettings: EngineSettings;
  positions: PositionEngineAnalysis[];
  criticalMoments: CriticalMoment[];
  limitations: string[];
  startedAt: string | null;
  completedAt: string | null;
};

export type PedagogicalReport = {
  target: AnalysisTarget;
  status: AnalysisJobStatus;
  pedagogicalLevel: PedagogicalLevel;
  promptVersion: string | null;
  summary: string | null;
  explanations: string[];
  studyRecommendations: string[];
  limitations: string[];
  generatedAt: string | null;
};

export type AnalysisJob = {
  id: string;
  target: AnalysisTarget;
  status: AnalysisJobStatus;
  createdAt: string;
  updatedAt: string;
  error: string | null;
};

export type StructuralAnalysisResult = {
  jobId: string;
  target: AnalysisTarget;
  status: "completed";
  message: string;
  completedAt: string;
  isDemonstration: true;
};

export type PositionAnalysisResult = {
  jobId: string;
  target: Extract<AnalysisTarget, { type: "position" }>;
  status: "completed";
  analysis: PositionEngineAnalysis;
  completedAt: string;
  isDemonstration: false;
};

export type AnalysisResult = StructuralAnalysisResult | PositionAnalysisResult;
