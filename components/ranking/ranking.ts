import type { RankingPlayer } from "@/lib/types/chess";

export const levelLabels: Record<RankingPlayer["level"], string> = {
  beginner: "Iniciante",
  intermediate: "Intermediário",
  advanced: "Avançado",
  expert: "Especialista",
  master: "Mestre",
};

export const formatPercent = (value: number): string => `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(Number.isFinite(value) ? value : 0)}%`;
export const formatNumber = (value: number): string => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0);

export function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function streakLabel(streak: number): string {
  if (streak > 0) return `${streak} vitória${streak === 1 ? "" : "s"}`;
  if (streak < 0) return `${Math.abs(streak)} derrota${streak === -1 ? "" : "s"}`;
  return "Sem sequência";
}

export function positionChange(player: RankingPlayer): { symbol: string; text: string } {
  if (player.previousPosition === undefined) return { symbol: "—", text: "Sem histórico anterior" };
  const difference = player.previousPosition - player.position;
  if (difference > 0) return { symbol: "↑", text: `Subiu ${difference} posiç${difference === 1 ? "ão" : "ões"}` };
  if (difference < 0) return { symbol: "↓", text: `Caiu ${Math.abs(difference)} posiç${difference === -1 ? "ão" : "ões"}` };
  return { symbol: "→", text: "Sem alteração" };
}
