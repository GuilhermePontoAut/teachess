import type { Metadata } from "next";
import { FutureAiContent } from "@/components/future-ai/FutureAiContent";

export const metadata: Metadata = { title: "Professor IA", description: "Professor digital do TeaChess conectado à OpenAI pelo servidor." };
export default function Page() { return <FutureAiContent />; }
