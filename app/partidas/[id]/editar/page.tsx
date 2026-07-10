import { Pencil } from "lucide-react";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export default async function EditGamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PlaceholderPage title="Editar partida" description={`Edição da partida ${id}.`} icon={Pencil} notice="O formulário completo de edição será implementado em uma próxima fase." />;
}
