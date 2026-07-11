import type { MatchReason } from "@/lib/types/play";

export const presenceLabels = { available: "Disponível", playing: "Em partida", away: "Ausente" } as const;
export const reasonLabels: Record<MatchReason, string> = {
  checkmate: "Xeque-mate",
  stalemate: "Empate por afogamento",
  insufficient: "Empate por material insuficiente",
  repetition: "Empate por repetição",
  "fifty-move": "Empate pela regra dos 50 lances",
  "draw-agreement": "Empate por acordo",
  resignation: "Vitória por abandono",
  timeout: "Vitória por tempo",
};

export const buttonBase = "rounded-xl px-4 py-2.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-45";

export function formatClock(milliseconds: number): string {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export function assignedColor(choice: "white" | "black" | "random", randomIndex: number): "white" | "black" {
  return choice === "random" ? (randomIndex % 2 === 0 ? "white" : "black") : choice;
}
