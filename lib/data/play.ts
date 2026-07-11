import { mockRankingPlayers } from "@/lib/data/rankings";
import type { AvailablePlayer, DemoPresence, TimeControl } from "@/lib/types/play";

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
  }));
