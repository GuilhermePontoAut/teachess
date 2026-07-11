import type { RankingPlayer } from "@/lib/types/chess";

export type RankingStreak =
  | { type: "win"; count: number }
  | { type: "loss"; count: number }
  | { type: "none"; count: 0 };

export const formatPercent = (value: number): string => `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(Number.isFinite(value) ? value : 0)}%`;
export const formatNumber = (value: number): string => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0);

export function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function parseRankingStreak(streak: number): RankingStreak {
  if (streak > 0) return { type: "win", count: streak };
  if (streak < 0) return { type: "loss", count: Math.abs(streak) };
  return { type: "none", count: 0 };
}

export function streakLabel(streak: number, abbreviated = false): string {
  const parsed = parseRankingStreak(streak);
  if (parsed.type === "none") return "-";
  if (abbreviated) return `${parsed.count} ${parsed.type === "win" ? "V" : "D"}`;
  const result = parsed.type === "win" ? "vitória" : "derrota";
  return `${parsed.count} ${result}${parsed.count === 1 ? "" : "s"}`;
}

export function streakAccessibleLabel(streak: number): string {
  const parsed = parseRankingStreak(streak);
  return parsed.type === "none" ? "Sem sequência atual" : `Sequência de ${streakLabel(streak)}`;
}

export function positionChange(player: RankingPlayer): { symbol: string; text: string } {
  if (player.previousPosition === undefined) return { symbol: "—", text: "Sem histórico anterior" };
  const difference = player.previousPosition - player.position;
  if (difference > 0) return { symbol: "↑", text: `Subiu ${difference} posiç${difference === 1 ? "ão" : "ões"}` };
  if (difference < 0) return { symbol: "↓", text: `Caiu ${Math.abs(difference)} posiç${difference === -1 ? "ão" : "ões"}` };
  return { symbol: "→", text: "Sem alteração" };
}
