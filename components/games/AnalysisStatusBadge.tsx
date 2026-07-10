import type { AnalysisStatus } from "@/lib/types/chess";
import { analysisStatusLabels } from "./games";

const styles: Record<AnalysisStatus, string> = {
  analyzed: "border-green-200 bg-green-50 text-green-800",
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  not_analyzed: "border-neutral-300 bg-neutral-100 text-neutral-700",
};

export function AnalysisStatusBadge({ status }: { status: AnalysisStatus }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>{analysisStatusLabels[status]}</span>;
}
