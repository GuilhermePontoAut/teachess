import type { Metadata } from "next";
import { RankingContent } from "@/components/ranking/RankingContent";

export const metadata: Metadata = { title: "Ranking" };

export default function Page() {
  return <RankingContent />;
}
