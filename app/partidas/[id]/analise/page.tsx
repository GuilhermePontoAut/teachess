import type { Metadata } from "next";
import { GameAnalysisContent } from "@/components/games/GameAnalysisContent";

export const metadata: Metadata = { title: "Análise simulada" };

export default async function GameAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GameAnalysisContent id={id} />;
}
