import { GameAnalysisContent } from "@/components/games/GameAnalysisContent";

export default async function GameAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GameAnalysisContent id={id} />;
}
