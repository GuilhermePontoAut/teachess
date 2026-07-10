import { Eye } from "lucide-react";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export default async function GameDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PlaceholderPage title="Detalhes da partida" description={`Partida identificada por ${id}.`} icon={Eye} notice="Os detalhes completos da partida serão implementados em uma próxima fase." />;
}
