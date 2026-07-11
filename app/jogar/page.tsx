import type { Metadata } from "next";
import { PlayContent } from "@/components/play/PlayContent";

export const metadata: Metadata = { title: "Jogar" };

export default function Page() { return <PlayContent/>; }
