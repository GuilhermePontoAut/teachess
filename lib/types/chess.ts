export type GameResult = "win" | "loss" | "draw";
export type GameStatus = "scheduled" | "in_progress" | "finished" | "abandoned";
export type PlayerColor = "white" | "black";
export type AnalysisStatus = "analyzed" | "pending" | "not_analyzed";
export type UserRole = "player" | "admin";
export type UserLevel = "beginner" | "intermediate" | "advanced";
export type GameOrigin = "platform" | "external";
export type GameVisibility = "public" | "private";
export type ExternalGameSource = "presencial" | "chess.com" | "lichess" | "outro";
export type ErrorCategory =
  | "opening"
  | "tactics"
  | "strategy"
  | "time_management"
  | "calculation"
  | "endgame";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  currentPlatformRating: number;
  level: UserLevel;
  avatarUrl?: string;
  createdAt: string;
}

interface BaseChessGame {
  id: string;
  visibility: GameVisibility;
  ownerUserId: string;
  playerUserId: string;
  opponentUserId?: string;
  addedManually: boolean;
  externalSource?: ExternalGameSource;
  externalSourceDetails?: string;
  title: string;
  event: string;
  date: string;
  opponent: string;
  playerColor: PlayerColor;
  result: GameResult;
  status: GameStatus;
  pgn: string;
  fen: string;
  onlineLink: string | null;
  notes: string;
  tags: string[];
  accuracy: number | null;
  analysisStatus: AnalysisStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformGame extends BaseChessGame {
  origin: "platform";
  playerRatingAtGame: number;
  opponentRatingAtGame: number;
  opening: string;
  moveCount: number;
}

export interface ExternalGame extends BaseChessGame {
  origin: "external";
  playerRatingAtGame?: number;
  opponentRatingAtGame?: number;
  opening?: string;
  moveCount?: number;
}

export type ChessGame = PlatformGame | ExternalGame;

export interface EvaluationPoint {
  move: number;
  evaluation: number;
}

export interface CriticalMoment {
  id: string;
  moveNumber: number;
  move: string;
  fen: string;
  category: ErrorCategory;
  severity: "inaccuracy" | "mistake" | "blunder";
  description: string;
  suggestion: string;
  evaluationBefore: number;
  evaluationAfter: number;
}

export interface GameAnalysis {
  id: string;
  gameId: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  criticalMoments: CriticalMoment[];
  errorCategories: ErrorCategory[];
  evaluationHistory: EvaluationPoint[];
  simulatedAccuracy: number;
  recommendation: string;
  createdAt: string;
}

export interface TrainingTopic {
  id: string;
  title: string;
  description: string;
  category: ErrorCategory;
  level: "beginner" | "intermediate" | "advanced";
  estimatedMinutes: number;
  progress: number;
  completed: boolean;
  exerciseCount: number;
}

export interface RankingPlayer {
  id: string;
  position: number;
  name: string;
  username: string;
  rating: number;
  previousRating: number;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  country: string;
  isCurrentUser: boolean;
}

export type ImageOrigin = "physical_board_photo" | "online_game_screenshot";
export type PhysicalBoardContext = "in_person_game" | "tournament" | "club" | "personal_study" | "other";
export type OnlineGameContext = "teachess" | "chess.com" | "lichess" | "other";
export type PositionSourceContext = PhysicalBoardContext | OnlineGameContext;
export type UploadMimeType = "image/jpeg" | "image/png" | "image/webp";
export type RecognitionStatus = "demo_available" | "preview_only" | "not_processed";

export interface UploadedPosition {
  id: string;
  ownerUserId: string;
  visibility: "private";
  title: string;
  imageOrigin: ImageOrigin;
  sourceContext: PositionSourceContext;
  date: string;
  sourceDetails: string;
  description: string;
  linkedGameId: string | null;
  tags: string[];
  fileName: string;
  fileSize: number;
  mimeType: UploadMimeType;
  simulatedDetectedFen: string | null;
  simulatedSideToMove: PlayerColor | null;
  simulatedConfidence: number | null;
  recognitionStatus: RecognitionStatus;
  favorite: boolean;
  personalStudyNotes: string;
  migrationNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CoachRecommendation {
  id: string;
  title: string;
  description: string;
  category: ErrorCategory;
  priority: "low" | "medium" | "high";
  relatedGameIds: string[];
  actionLabel: string;
  completed: boolean;
  createdAt: string;
}
