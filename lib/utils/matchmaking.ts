import type { AvailablePlayer, OpenMatchRoom, RatingRangeOption, TimeControl } from "@/lib/types/play";

export function ratingDifference(rating: number, reference: number): number { return rating - reference; }
export function ratingLimits(rating: number, option: RatingRangeOption): { min: number; max: number } {
  if (option === "unlimited") return { min: 0, max: Number.MAX_SAFE_INTEGER };
  const delta = Number(option); return { min: Math.max(0, rating - delta), max: rating + delta };
}
export function acceptsDirectChallenge(player: AvailablePlayer, challengerRating: number): boolean {
  const delta = challengerRating - player.currentPlatformRating;
  return delta >= player.incomingChallengeRange.minDelta && delta <= player.incomingChallengeRange.maxDelta;
}
export function canEnterRoom(room: OpenMatchRoom, userId: string, userRating: number): { allowed: boolean; reason?: string } {
  if (room.creatorPlayerId === userId) return { allowed: false, reason: "Você criou esta sala." };
  if (room.status !== "open") return { allowed: false, reason: room.status === "occupied" ? "Sala ocupada." : "Sala cancelada." };
  if (userRating < room.minRating || userRating > room.maxRating) return { allowed: false, reason: `Seu rating deve estar entre ${room.minRating} e ${room.maxRating}.` };
  return { allowed: true };
}
export function sortPlayersByRatingProximity(players: AvailablePlayer[], rating: number): AvailablePlayer[] {
  return [...players].sort((a, b) => Math.abs(a.currentPlatformRating - rating) - Math.abs(b.currentPlatformRating - rating) || a.id.localeCompare(b.id));
}
export function findSimulatedOpponent(players: AvailablePlayer[], userId: string, userRating: number, range: RatingRangeOption, control: TimeControl): AvailablePlayer | null {
  const { min, max } = ratingLimits(userRating, range);
  const eligible = players.filter((player) => player.id !== userId && player.presence === "available" && player.currentPlatformRating >= min && player.currentPlatformRating <= max && acceptsDirectChallenge(player, userRating));
  const preferred = eligible.filter((player) => player.preferredTime === `${control.minutes} + ${control.increment}`);
  return sortPlayersByRatingProximity(preferred.length ? preferred : eligible, userRating)[0] ?? null;
}
