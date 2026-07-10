import type { RankingPlayer } from "@/lib/types/chess";

const names = ["Helena Prado","Rafael Nunes","Sofia Martins","Marina Costa","Gustavo Reis","Lívia Torres","Bruno Lima","TeaChess Você","Caio Mendes","Diego Alves","Pedro Azevedo","Camila Rocha","João Viana","André Farias","Nina Campos","Lucas Freire","Bia Cardoso","Tomás Ribeiro","Clara Neves","Miguel Paiva"];
const countries = ["Brasil","Brasil","Portugal","Brasil","Argentina","Brasil","Brasil","Brasil","Brasil","Chile","Brasil","Brasil","Portugal","Brasil","Uruguai","Brasil","Brasil","Portugal","Brasil","Argentina"];

export const mockRankingPlayers: RankingPlayer[] = names.map((name, index) => {
  const gamesPlayed = 48 - index;
  const wins = Math.max(12, 29 - index);
  const draws = 5 + (index % 5);
  return {
    id: `player-${String(index + 1).padStart(2, "0")}`,
    position: index + 1,
    name,
    username: index === 7 ? "voce_teachess" : name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replaceAll(" ", "."),
    rating: 1810 - index * 18,
    previousRating: 1802 - index * 17,
    gamesPlayed,
    wins,
    draws,
    losses: gamesPlayed - wins - draws,
    country: countries[index],
    isCurrentUser: index === 7,
  };
});
