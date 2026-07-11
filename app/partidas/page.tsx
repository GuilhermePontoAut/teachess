import type { Metadata } from "next";
import { GamesContent } from "@/components/games/GamesContent";

export const metadata: Metadata = { title: "Minhas Partidas" };

export default async function GamesPage({ searchParams }: { searchParams: Promise<{ success?: string }> }) {
  const { success } = await searchParams;
  return <GamesContent initialMessage={success === "created" ? "Partida externa adicionada com sucesso." : success === "game-updated" ? "Partida atualizada com sucesso." : success === "updated" ? "Observações atualizadas com sucesso." : ""} />;
}
