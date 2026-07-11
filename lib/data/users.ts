import type { User } from "@/lib/types/chess";

export const currentUser: User = {
  id: "user-current",
  name: "TeaChess Você",
  role: "player",
  currentPlatformRating: 1745,
  level: "intermediate",
  createdAt: "2025-09-10T12:00:00.000Z",
};

export const platformOpponents: User[] = [
  { id: "user-marina", name: "Marina Costa", role: "player", currentPlatformRating: 1768, level: "intermediate", createdAt: "2025-05-12T12:00:00.000Z" },
  { id: "user-rafael", name: "Rafael Nunes", role: "player", currentPlatformRating: 1792, level: "intermediate", createdAt: "2025-04-03T12:00:00.000Z" },
  { id: "user-bruno", name: "Bruno Lima", role: "player", currentPlatformRating: 1640, level: "intermediate", createdAt: "2025-11-18T12:00:00.000Z" },
  { id: "user-helena", name: "Helena Prado", role: "player", currentPlatformRating: 1810, level: "advanced", createdAt: "2025-02-20T12:00:00.000Z" },
  { id: "user-caio", name: "Caio Mendes", role: "player", currentPlatformRating: 1695, level: "intermediate", createdAt: "2025-08-14T12:00:00.000Z" },
  { id: "user-livia", name: "Lívia Torres", role: "player", currentPlatformRating: 1722, level: "intermediate", createdAt: "2025-06-01T12:00:00.000Z" },
  { id: "user-diego", name: "Diego Alves", role: "player", currentPlatformRating: 1678, level: "intermediate", createdAt: "2025-10-05T12:00:00.000Z" },
  { id: "user-sofia", name: "Sofia Martins", role: "player", currentPlatformRating: 1784, level: "intermediate", createdAt: "2025-03-27T12:00:00.000Z" },
];

export const mockUsers: User[] = [currentUser, ...platformOpponents];

export const getUserById = (id?: string): User | undefined =>
  id ? mockUsers.find((user) => user.id === id) : undefined;
