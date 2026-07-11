import { mockRankingPlayers } from "@/lib/data/rankings";
import type { AvailablePlayer, DemoPresence, OpenMatchRoom, TimeControl } from "@/lib/types/play";

export const timeControls: TimeControl[] = [
  { id: "1-0", minutes: 1, increment: 0, category: "Bullet" },
  { id: "3-0", minutes: 3, increment: 0, category: "Blitz" },
  { id: "3-2", minutes: 3, increment: 2, category: "Blitz" },
  { id: "5-0", minutes: 5, increment: 0, category: "Blitz" },
  { id: "10-0", minutes: 10, increment: 0, category: "Rápida" },
  { id: "10-5", minutes: 10, increment: 5, category: "Rápida" },
  { id: "15-10", minutes: 15, increment: 10, category: "Rápida" },
];

const presenceCycle: DemoPresence[] = ["available", "available", "playing", "available", "away"];
const preferences = ["10 + 0", "3 + 2", "5 + 0", "15 + 10"];

// Presença e preferências são metadados locais determinísticos; a identidade e o rating
// continuam vindo da fonte única do ranking mockado.
export const availablePlayers: AvailablePlayer[] = mockRankingPlayers
  .filter((player) => !player.isCurrentUser)
  .map((player, index) => ({
    ...player,
    presence: presenceCycle[index % presenceCycle.length],
    preferredTime: preferences[index % preferences.length],
    incomingChallengeRange: index % 5 === 0 ? { minDelta: -100, maxDelta: 100 } : index % 3 === 0 ? { minDelta: -400, maxDelta: 400 } : { minDelta: -200, maxDelta: 200 },
  }));

const roomSpecs = [
  [0, "10-0", "random", -200, 200, "open"], [1, "3-2", "white", -100, 200, "open"],
  [2, "5-0", "black", -400, 400, "occupied"], [3, "15-10", "random", -100, 100, "open"],
  [4, "1-0", "white", -200, 400, "open"], [5, "10-5", "black", -400, 100, "cancelled"],
  [6, "3-0", "random", -200, 200, "open"], [7, "5-0", "white", -100, 100, "open"],
  [8, "10-0", "black", -400, 400, "open"], [9, "3-2", "random", -200, 200, "open"],
] as const;

export const openMatchRooms: OpenMatchRoom[] = roomSpecs.map(([playerIndex, controlId, colorPreference, minDelta, maxDelta, status], index) => {
  const player = availablePlayers[playerIndex];
  const timeControl = timeControls.find((control) => control.id === controlId) ?? timeControls[0];
  return { id: `demo-room-${index + 1}`, creatorPlayerId: player.id, creatorName: player.name, creatorRating: player.currentPlatformRating, region: player.region, timeControl, category: timeControl.category, colorPreference, minRating: player.currentPlatformRating + minDelta, maxRating: player.currentPlatformRating + maxDelta, createdAt: new Date(Date.UTC(2026, 6, 11, 14, 30 - index)).toISOString(), status, isDemo: true };
});
