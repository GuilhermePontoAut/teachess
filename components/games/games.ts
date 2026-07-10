import type { AnalysisStatus, GameResult, PlayerColor } from "@/lib/types/chess";

export type ResultFilter = "all" | GameResult;
export type ColorFilter = "all" | PlayerColor;
export type AnalysisFilter = "all" | AnalysisStatus;
export type GamesSort = "newest" | "oldest" | "rating-desc" | "rating-asc" | "accuracy-desc" | "accuracy-asc";

export interface GameFilterState {
  query: string;
  result: ResultFilter;
  color: ColorFilter;
  analysis: AnalysisFilter;
  opening: string;
  sort: GamesSort;
}

export const initialGameFilters: GameFilterState = {
  query: "",
  result: "all",
  color: "all",
  analysis: "all",
  opening: "all",
  sort: "newest",
};

export const analysisStatusLabels: Record<AnalysisStatus, string> = {
  analyzed: "Analisada",
  pending: "Pendente",
  not_analyzed: "Não analisada",
};
