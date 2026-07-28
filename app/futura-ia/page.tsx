import type { Metadata } from "next";
import { FutureAiContent } from "@/components/future-ai/FutureAiContent";

export const metadata: Metadata = {
  title: "Professor IA",
  description: "Análise automática demonstrativa de partidas e posições no TeaChess.",
};
export default function Page() { return <FutureAiContent />; }
