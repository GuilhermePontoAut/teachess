import { EditGameContent } from "@/components/games/EditGameContent";

export default async function EditGamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditGameContent id={id} />;
}
