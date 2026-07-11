import type { AnalysisStatus, GameOrigin, GameResult, PlayerColor } from "@/lib/types/chess";

export type ResultFilter = "all" | GameResult;
export type ColorFilter = "all" | PlayerColor;
export type AnalysisFilter = "all" | AnalysisStatus;
export type OriginFilter = "all" | GameOrigin;
export type GamesSort = "newest" | "oldest" | "rating-desc" | "rating-asc" | "moves-desc" | "moves-asc" | "accuracy-desc" | "accuracy-asc";

export interface GameFilterState {
  query: string;
  result: ResultFilter;
  color: ColorFilter;
  analysis: AnalysisFilter;
  origin: OriginFilter;
  opening: string;
  sort: GamesSort;
}

export const initialGameFilters: GameFilterState = {
  query: "",
  result: "all",
  color: "all",
  analysis: "all", origin: "all",
  opening: "all",
  sort: "newest",
};

export const analysisStatusLabels: Record<AnalysisStatus, string> = {
  analyzed: "Analisada",
  pending: "Pendente",
  not_analyzed: "Não analisada",
};
