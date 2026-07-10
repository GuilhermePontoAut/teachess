import { BarChart3 } from "lucide-react";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export default async function GameAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PlaceholderPage title="Análise da partida" description={`Análise simulada da partida ${id}.`} icon={BarChart3} notice="A experiência completa de análise será implementada em uma próxima fase, sem motor de xadrez nesta versão." />;
}
