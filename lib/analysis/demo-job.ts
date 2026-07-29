import type {
  AnalysisJob,
  AnalysisJobStatus,
  AnalysisTarget,
  StructuralAnalysisResult,
} from "./contracts";

export const STRUCTURAL_ANALYSIS_MESSAGE =
  "A estrutura da análise foi preparada. A integração com o Stockfish será adicionada na próxima etapa.";

const allowedTransitions: Record<AnalysisJobStatus, AnalysisJobStatus[]> = {
  idle: ["preparing"],
  preparing: ["analyzing", "cancelled", "failed"],
  analyzing: ["completed", "cancelled", "failed"],
  completed: ["preparing"],
  cancelled: ["preparing"],
  failed: ["preparing"],
};

export function createDemoAnalysisJob(
  target: AnalysisTarget,
  now: string,
  id: string,
): AnalysisJob {
  return { id, target, status: "idle", createdAt: now, updatedAt: now, error: null };
}

export function transitionAnalysisJob(
  job: AnalysisJob,
  status: AnalysisJobStatus,
  now: string,
  error: string | null = null,
): AnalysisJob {
  if (!allowedTransitions[job.status].includes(status)) {
    throw new Error(`Invalid analysis job transition: ${job.status} -> ${status}`);
  }
  return { ...job, status, updatedAt: now, error: status === "failed" ? error : null };
}

export function completeDemoAnalysis(
  job: AnalysisJob,
): StructuralAnalysisResult {
  if (job.status !== "completed") {
    throw new Error("A structural result requires a completed job.");
  }
  return {
    jobId: job.id,
    target: job.target,
    status: "completed",
    message: STRUCTURAL_ANALYSIS_MESSAGE,
    completedAt: job.updatedAt,
    isDemonstration: true,
  };
}
