import { GamesContent } from "@/components/games/GamesContent";

export default async function GamesPage({ searchParams }: { searchParams: Promise<{ success?: string }> }) {
  const { success } = await searchParams;
  return <GamesContent initialMessage={success === "created" ? "Partida criada com sucesso." : success === "updated" ? "Partida atualizada com sucesso." : ""} />;
}
