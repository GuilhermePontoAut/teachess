import { GamesContent } from "@/components/games/GamesContent";

export default async function GamesPage({ searchParams }: { searchParams: Promise<{ success?: string }> }) {
  const { success } = await searchParams;
  return <GamesContent initialMessage={success === "created" ? "Partida externa adicionada com sucesso." : success === "game-updated" ? "Partida atualizada com sucesso." : success === "updated" ? "Observações atualizadas com sucesso." : ""} />;
}
