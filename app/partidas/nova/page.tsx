import type { Metadata } from "next";
import { NewGameContent } from "@/components/games/NewGameContent";

export const metadata: Metadata = { title: "Adicionar partida externa" };

export default function NewGamePage() {
  return <NewGameContent />;
}
