import type { ChessGame, GameResult, PlayerColor, RankingPlayer } from "@/lib/types/chess";

export const resultLabels: Record<GameResult, string> = { win:"Vitória", loss:"Derrota", draw:"Empate" };
export const colorLabels: Record<PlayerColor, string> = { white:"Brancas", black:"Pretas" };

export const getResultScore = (result: GameResult): number => result === "win" ? 1 : result === "draw" ? 0.5 : 0;
export const sortGamesByDate = (games: ChessGame[]): ChessGame[] => [...games].sort((a, b) => b.date.localeCompare(a.date));
export const sortRankingPlayers = (players: RankingPlayer[]): RankingPlayer[] => [...players].sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name));
export const isPlausibleFen = (fen: string): boolean => fen.trim().split(/\s+/).length === 6 && fen.split("/").length === 8;
export const hasPgnResult = (pgn: string): boolean => /(?:1-0|0-1|1\/2-1\/2|\*)\s*$/.test(pgn.trim());
