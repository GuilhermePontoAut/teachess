import type { Metadata } from "next";
import { PositionStudyContent } from "@/components/study/PositionStudyContent";

export const metadata: Metadata = { title: "Estudar posição" };
export default async function PositionStudyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PositionStudyContent id={id}/>;
}
