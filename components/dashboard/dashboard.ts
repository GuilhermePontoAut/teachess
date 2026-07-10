import type { ErrorCategory, GameResult } from "@/lib/types/chess";

export const errorCategoryLabels: Record<ErrorCategory, string> = {
  opening: "Abertura",
  tactics: "Tática",
  strategy: "Estratégia",
  time_management: "Gestão do tempo",
  calculation: "Cálculo",
  endgame: "Final",
};

export const resultStyles: Record<GameResult, string> = {
  win: "border-success/20 bg-success-subtle text-success",
  loss: "border-danger/20 bg-danger-subtle text-danger",
  draw: "border-draw/20 bg-draw-subtle text-draw",
};

export interface RatingPoint {
  date: string;
  rating: number;
}

export interface CountItem {
  name: string;
  count: number;
}
