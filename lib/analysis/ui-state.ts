import type { AnalysisJobStatus } from "./contracts";

export function isAnalysisActionDisabled(
  status: AnalysisJobStatus,
  hasSelection: boolean,
): boolean {
  return !hasSelection || status === "preparing" || status === "analyzing";
}
