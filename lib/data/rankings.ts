import { currentUser } from "@/lib/data/users";
import type { RankingPlayer } from "@/lib/types/chess";

const names = ["Helena Prado","Rafael Nunes","Sofia Martins","Marina Costa","Gustavo Reis","Lívia Torres","Bruno Lima",currentUser.name,"Caio Mendes","Diego Alves","Pedro Azevedo","Camila Rocha","João Viana","André Farias","Nina Campos","Lucas Freire","Bia Cardoso","Tomás Ribeiro","Clara Neves","Miguel Paiva"];
const regions = ["Brasil","Brasil","Portugal","Brasil","Argentina","Brasil","Brasil","Brasil","Brasil","Chile","Brasil","Brasil","Portugal","Brasil","Uruguai","Brasil","Brasil","Portugal","Brasil","Argentina"];
const levels: RankingPlayer["level"][] = ["master","expert","advanced","advanced","advanced","advanced","intermediate","intermediate","intermediate","intermediate","intermediate","intermediate","intermediate","intermediate","beginner","intermediate","beginner","beginner","beginner","beginner"];
const userIds = ["user-helena","user-rafael","user-sofia","user-marina","player-gustavo","user-livia","user-bruno",currentUser.id,"user-caio","user-diego"];

export const mockRankingPlayers: RankingPlayer[] = names.map((name, index) => {
  const platformGames = 58 - index;
  const wins = Math.max(13, 34 - index);
  const draws = 5 + (index % 4);
  const rating = index === 7 ? currentUser.currentPlatformRating : 1906 - index * 24;
  return {
    id: userIds[index] ?? `player-${String(index + 1).padStart(2, "0")}`,
    position: index + 1,
    previousPosition: index % 5 === 0 ? index + 2 : index % 4 === 0 ? Math.max(1, index) : index + 1,
    name,
    username: index === 7 ? "voce_teachess" : name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replaceAll(" ", "."),
    currentPlatformRating: rating,
    platformGames,
    wins,
    draws,
    losses: platformGames - wins - draws,
    winRate: (wins / platformGames) * 100,
    currentStreak: index % 6 === 2 ? -2 : index % 5,
    region: regions[index],
    level: levels[index],
    memberSince: index === 7 ? currentUser.createdAt : `2025-${String((index % 11) + 1).padStart(2, "0")}-${String((index % 20) + 1).padStart(2, "0")}T12:00:00.000Z`,
    isCurrentUser: index === 7,
    favoriteOpenings: index % 3 === 0 ? ["Italiana", "Gambito da Dama"] : undefined,
    ratingHistory: index < 5 ? [{ date: "2026-04-01", rating: rating - 32 }, { date: "2026-05-01", rating: rating - 14 }, { date: "2026-06-01", rating }] : undefined,
  };
});
