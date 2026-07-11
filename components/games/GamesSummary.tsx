"use client";

import { CircleEqual, Clock3, ExternalLink, LockKeyhole, Monitor, Percent, SearchCheck, ShieldCheck, Swords, Trophy, XCircle, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { currentUser } from "@/lib/data/users";
import type { ChessGame } from "@/lib/types/chess";

type SummaryView = "general" | "platform" | "external";
type SummaryValue = number | string;

interface SummaryMetric {
  label: string;
  value: SummaryValue;
  icon: LucideIcon;
  description?: string;
}

const views: Array<{ id: SummaryView; label: string }> = [
  { id: "general", label: "Geral" },
  { id: "platform", label: "Plataforma" },
  { id: "external", label: "Externas" },
];

function SummaryItem({ label, value, icon: Icon, description }: SummaryMetric) {
  return <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><span className="text-sm font-medium text-muted">{label}</span><Icon size={17} className="shrink-0 text-neutral-500" aria-hidden="true" /></div><p className="mt-2 text-2xl font-bold text-neutral-950">{value}</p>{description && <p className="mt-2 text-xs leading-5 text-muted">{description}</p>}</div>;
}

const count = (games: ChessGame[], predicate: (game: ChessGame) => boolean) => games.filter(predicate).length;
const winRate = (games: ChessGame[]) => games.length === 0 ? "0%" : `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format((count(games, (game) => game.result === "win") / games.length) * 100)}%`;

function resultMetrics(games: ChessGame[]): SummaryMetric[] {
  return [
    { label: "Vitórias", value: count(games, (game) => game.result === "win"), icon: Trophy },
    { label: "Derrotas", value: count(games, (game) => game.result === "loss"), icon: XCircle },
    { label: "Empates", value: count(games, (game) => game.result === "draw"), icon: CircleEqual },
    { label: "Analisadas", value: count(games, (game) => game.analysisStatus === "analyzed"), icon: SearchCheck },
    { label: "Pendentes", value: count(games, (game) => game.analysisStatus !== "analyzed"), icon: Clock3 },
  ];
}

export function GamesSummary({ games }: { games: ChessGame[] }) {
  const [activeView, setActiveView] = useState<SummaryView>("general");
  const userGames = games.filter((game) => game.ownerUserId === currentUser.id);
  const platformGames = userGames.filter((game) => game.origin === "platform");
  const externalGames = userGames.filter((game) => game.origin === "external");
  const metrics: Record<SummaryView, SummaryMetric[]> = {
    general: [
      { label: "Total", value: userGames.length, icon: Swords },
      { label: "Plataforma", value: platformGames.length, icon: Monitor },
      { label: "Externas", value: externalGames.length, icon: ExternalLink },
      ...resultMetrics(userGames),
    ],
    platform: [
      { label: "Total na plataforma", value: platformGames.length, icon: Monitor },
      ...resultMetrics(platformGames),
      { label: "Taxa de vitória", value: winRate(platformGames), icon: Percent },
      { label: "Válidas para ranking", value: platformGames.length, icon: ShieldCheck, description: "Todas contam para estatísticas oficiais e ranking." },
    ],
    external: [
      { label: "Total de externas", value: externalGames.length, icon: ExternalLink },
      ...resultMetrics(externalGames),
      { label: "Taxa de vitória", value: winRate(externalGames), icon: Percent },
      { label: "Partidas privadas", value: count(externalGames, (game) => game.visibility === "private"), icon: LockKeyhole, description: "Privadas; não contam para o ranking nem alteram o rating oficial." },
    ],
  };

  return <section aria-labelledby="games-summary-title" className="space-y-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h2 id="games-summary-title" className="font-semibold text-neutral-950">Resumo das partidas</h2><div role="tablist" aria-label="Visão das estatísticas" className="inline-flex w-full rounded-xl border border-line bg-neutral-100 p-1 sm:w-auto">{views.map((view) => <button key={view.id} id={`summary-tab-${view.id}`} type="button" role="tab" aria-selected={activeView === view.id} aria-controls={`summary-panel-${view.id}`} onClick={() => setActiveView(view.id)} className={`flex-1 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:flex-none ${activeView === view.id ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-600 hover:text-neutral-950"}`}>{view.label}</button>)}</div></div><div id={`summary-panel-${activeView}`} role="tabpanel" aria-labelledby={`summary-tab-${activeView}`} className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">{metrics[activeView].map((metric) => <SummaryItem key={metric.label} {...metric} />)}</div></section>;
}
