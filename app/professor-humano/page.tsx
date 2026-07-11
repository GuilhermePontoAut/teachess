import type { Metadata } from "next";
import { HumanTeachersContent } from "@/components/human-teachers/HumanTeachersContent";
export const metadata: Metadata = { title: "Professor humano", description: "Catálogo e agendamento simulados de professores de xadrez." };
export default function Page() { return <HumanTeachersContent/>; }
