import type { ChessGame, RankingPlayer } from "@/lib/types/chess";
import { countsForRanking } from "@/lib/utils/gameRules";

export type RankingSort = "official" | "rating" | "win-rate" | "games" | "wins" | "streak";
export type RatingRange = "all" | "under-1200" | "1200-1499" | "1500-1799" | "1800-plus";

export interface CommunitySummary {
  rankedPlayers: number;
  highestRating: number;
  averageRating: number;
  officialGames: number;
  averageWinRate: number;
  longestStreakPlayer: RankingPlayer | null;
}

const officialComparison = (a: RankingPlayer, b: RankingPlayer): number =>
  b.currentPlatformRating - a.currentPlatformRating || b.wins - a.wins || b.winRate - a.winRate || a.name.localeCompare(b.name, "pt-BR");

export function rankPlayers(players: RankingPlayer[]): RankingPlayer[] {
  return [...players].sort(officialComparison).map((player, index) => ({ ...player, position: index + 1 }));
}

export function getOfficialGameStats(games: ChessGame[], userId: string) {
  const official = games.filter((game) => game.playerUserId === userId && countsForRanking(game));
  const wins = official.filter((game) => game.result === "win").length;
  const losses = official.filter((game) => game.result === "loss").length;
  const draws = official.filter((game) => game.result === "draw").length;
  const latest = [...official].sort((a, b) => b.date.localeCompare(a.date));
  const firstResult = latest[0]?.result;
  const streakLength = firstResult ? latest.findIndex((game) => game.result !== firstResult) : 0;
  const normalizedLength = streakLength === -1 ? latest.length : streakLength;
  return { platformGames: official.length, wins, losses, draws, winRate: official.length ? (wins / official.length) * 100 : 0, currentStreak: firstResult === "win" ? normalizedLength : firstResult === "loss" ? -normalizedLength : 0 };
}

export function mergeCurrentUserStats(players: RankingPlayer[], games: ChessGame[], userId: string, rating: number): RankingPlayer[] {
  return players.map((player) => player.id === userId || player.isCurrentUser ? { ...player, id: userId, currentPlatformRating: rating, ...getOfficialGameStats(games, userId), isCurrentUser: true } : player);
}

export function getCommunitySummary(players: RankingPlayer[]): CommunitySummary {
  if (!players.length) return { rankedPlayers: 0, highestRating: 0, averageRating: 0, officialGames: 0, averageWinRate: 0, longestStreakPlayer: null };
  const longestStreakPlayer = [...players].sort((a, b) => Math.abs(b.currentStreak) - Math.abs(a.currentStreak))[0] ?? null;
  return {
    rankedPlayers: players.length,
    highestRating: Math.max(...players.map((player) => player.currentPlatformRating)),
    averageRating: players.reduce((sum, player) => sum + player.currentPlatformRating, 0) / players.length,
    officialGames: players.reduce((sum, player) => sum + player.platformGames, 0),
    averageWinRate: players.reduce((sum, player) => sum + player.winRate, 0) / players.length,
    longestStreakPlayer,
  };
}

export function sortRankingView(players: RankingPlayer[], sort: RankingSort): RankingPlayer[] {
  const sorted = [...players];
  if (sort === "official") return sorted.sort((a, b) => a.position - b.position);
  const comparisons: Record<Exclude<RankingSort, "official">, (a: RankingPlayer, b: RankingPlayer) => number> = {
    rating: (a, b) => b.currentPlatformRating - a.currentPlatformRating,
    "win-rate": (a, b) => b.winRate - a.winRate,
    games: (a, b) => b.platformGames - a.platformGames,
    wins: (a, b) => b.wins - a.wins,
    streak: (a, b) => b.currentStreak - a.currentStreak,
  };
  return sorted.sort((a, b) => comparisons[sort](a, b) || a.position - b.position);
}

export function matchesRatingRange(rating: number, range: RatingRange): boolean {
  if (range === "under-1200") return rating <= 1199;
  if (range === "1200-1499") return rating >= 1200 && rating <= 1499;
  if (range === "1500-1799") return rating >= 1500 && rating <= 1799;
  if (range === "1800-plus") return rating >= 1800;
  return true;
}

// Segurança, autorização e cálculos competitivos oficiais deverão ser repetidos e validados pelo backend futuro.
