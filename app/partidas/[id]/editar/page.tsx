import type { Metadata } from "next";
import { EditGameContent } from "@/components/games/EditGameContent";

export const metadata: Metadata = { title: "Editar partida" };

export default async function EditGamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditGameContent id={id} />;
}
