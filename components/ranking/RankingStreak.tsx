import { TrendingDown, TrendingUp } from "lucide-react";
import { parseRankingStreak, streakAccessibleLabel, streakLabel } from "./ranking";

export function RankingStreak({ streak, abbreviated = false }: { streak: number; abbreviated?: boolean }) {
  const parsed = parseRankingStreak(streak);

  if (parsed.type === "none") return <span aria-label={streakAccessibleLabel(streak)}>-</span>;

  const Icon = parsed.type === "win" ? TrendingUp : TrendingDown;
  const color = parsed.type === "win" ? "text-green-800" : "text-red-700";
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap font-semibold ${color}`} aria-label={streakAccessibleLabel(streak)}>
      <Icon size={15} aria-hidden="true" />
      <span aria-hidden="true">{streakLabel(streak, abbreviated)}</span>
    </span>
  );
}
