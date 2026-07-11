import type { Metadata } from "next";
import { GameDetailsContent } from "@/components/games/GameDetailsContent";

export const metadata: Metadata = { title: "Detalhes da partida" };

export default async function GameDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GameDetailsContent id={id} />;
}
