import type {
  AnalysisJob,
  AnalysisTarget,
  EngineSettings,
  GameAnalysis,
  PedagogicalReport,
  PositionEngineAnalysis,
} from "./contracts";
import type { PedagogicalProfile } from "./pedagogical-profile";

export interface ChessEngineAnalyzer {
  analyzePosition(
    fen: string,
    settings: EngineSettings,
  ): Promise<PositionEngineAnalysis>;
  analyzeGame(
    target: Extract<AnalysisTarget, { type: "game" }>,
    settings: EngineSettings,
  ): Promise<GameAnalysis>;
}

export interface PedagogicalReportGenerator {
  generate(input: {
    target: AnalysisTarget;
    gameAnalysis?: GameAnalysis;
    positionAnalysis?: PositionEngineAnalysis;
    profile: PedagogicalProfile;
  }): Promise<PedagogicalReport>;
}

export interface AnalysisRepository {
  saveJob(job: AnalysisJob): Promise<void>;
  findJobById(jobId: string): Promise<AnalysisJob | null>;
  saveGameAnalysis(analysis: GameAnalysis): Promise<void>;
  savePedagogicalReport(report: PedagogicalReport): Promise<void>;
}
