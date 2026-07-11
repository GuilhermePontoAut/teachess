import type { Metadata } from "next";
import { FutureAiContent } from "@/components/future-ai/FutureAiContent";

export const metadata: Metadata = { title: "Futura IA", description: "Demonstração local e simulada do futuro professor digital do TeaChess." };
export default function Page() { return <FutureAiContent />; }
