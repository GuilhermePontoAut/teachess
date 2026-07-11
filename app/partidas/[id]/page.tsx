import { GameDetailsContent } from "@/components/games/GameDetailsContent";

export default async function GameDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GameDetailsContent id={id} />;
}
