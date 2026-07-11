import type { Metadata } from "next";
import { TrainingContent } from "@/components/training/TrainingContent";

export const metadata: Metadata = { title: "Treinamento", description: "Plano pessoal e privado de treinamento de xadrez no TeaChess." };

export default function Page() { return <TrainingContent />; }
