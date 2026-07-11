import { Flame, Gauge, Percent, Swords, Trophy, Users } from "lucide-react";
import type { CommunitySummary } from "@/lib/utils/ranking";
import { formatNumber, formatPercent, streakLabel } from "./ranking";

export function RankingSummary({ summary }: { summary: CommunitySummary }) {
  const items = [{ label: "Jogadores ranqueados", value: summary.rankedPlayers, icon: Users }, { label: "Maior rating", value: summary.highestRating, icon: Trophy }, { label: "Média de rating", value: formatNumber(summary.averageRating), icon: Gauge }, { label: "Partidas", value: formatNumber(summary.officialGames), icon: Swords }, { label: "Média de vitórias", value: formatPercent(summary.averageWinRate), icon: Percent }, { label: "Maior sequência atual", value: summary.longestStreakPlayer ? `${summary.longestStreakPlayer.name} · ${streakLabel(summary.longestStreakPlayer.currentStreak)}` : "—", icon: Flame }];
  return <section aria-labelledby="community-summary-title"><h2 id="community-summary-title" className="mb-4 text-xl font-semibold">Resumo da comunidade</h2><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{items.map(({ label, value, icon: Icon }) => <div key={label} className="min-w-0 rounded-2xl border border-line bg-white p-4 shadow-sm"><div className="flex items-center justify-between gap-3"><p className="text-sm text-muted">{label}</p><Icon size={17} className="shrink-0 text-neutral-500" aria-hidden="true" /></div><p className="mt-2 break-words text-xl font-bold tabular-nums">{value}</p></div>)}</div></section>;
}
