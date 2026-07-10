import type { GameResult } from "@/lib/types/chess";
import { resultLabels } from "@/lib/utils/chess";

const styles: Record<GameResult, string> = {
  win: "border-green-200 bg-green-50 text-green-800",
  loss: "border-red-200 bg-red-50 text-red-800",
  draw: "border-amber-200 bg-amber-50 text-amber-800",
};

export function ResultBadge({ result }: { result: GameResult }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[result]}`}>{resultLabels[result]}</span>;
}
