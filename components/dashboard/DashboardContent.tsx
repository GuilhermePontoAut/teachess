"use client";

import { CircleEqual, Gauge, Swords, Target, Trophy, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MockNotice } from "@/components/MockNotice";
import { PageTitle } from "@/components/PageTitle";
import { mockAnalyses } from "@/lib/data/analyses";
import { mockRecommendations } from "@/lib/data/recommendations";
import type { ErrorCategory } from "@/lib/types/chess";
import { sortGamesByDate } from "@/lib/utils/chess";
import { hydrateGameStore, useGameStore } from "@/store/useGameStore";
import { errorCategoryLabels, type CountItem } from "./dashboard";
import { FrequentMistakes } from "./FrequentMistakes";
import { PopularOpenings } from "./PopularOpenings";
import { RatingChart } from "./RatingChart";
import { RecentGames } from "./RecentGames";
import { ResultsChart } from "./ResultsChart";
import { StatCard } from "./StatCard";
import { StudyRecommendation } from "./StudyRecommendation";

export function DashboardContent() {
  const games = useGameStore((state) => state.games);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    void hydrateGameStore().finally(() => { if (active) setHydrated(true); });
    return () => { active = false; };
  }, []);

  const dashboard = useMemo(() => {
    const sortedGames = sortGamesByDate(games);
    const wins = games.filter((game) => game.result === "win").length;
    const losses = games.filter((game) => game.result === "loss").length;
    const draws = games.filter((game) => game.result === "draw").length;
    const openingCounts = games.reduce<Map<string, number>>((counts, game) => counts.set(game.opening, (counts.get(game.opening) ?? 0) + 1), new Map());
    const openings: CountItem[] = [...openingCounts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "pt-BR")).slice(0, 5);
    const categoryCounts = mockAnalyses.flatMap((analysis) => analysis.errorCategories).reduce<Map<ErrorCategory, number>>((counts, category) => counts.set(category, (counts.get(category) ?? 0) + 1), new Map());
    const mistakes: CountItem[] = [...categoryCounts].map(([category, count]) => ({ name: errorCategoryLabels[category], count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "pt-BR")).slice(0, 5);
    const ratingHistory = [...games].sort((a, b) => a.date.localeCompare(b.date)).map((game) => ({ date: game.date, rating: game.playerRating }));
    return { sortedGames, wins, losses, draws, openings, mistakes, ratingHistory };
  }, [games]);

  if (!hydrated) {
    return <div role="status" aria-live="polite" className="space-y-6"><PageTitle eyebrow="Visão geral" title="Dashboard" description="Acompanhe sua evolução, seus resultados e os próximos temas de estudo." /><div className="animate-pulse rounded-2xl border border-line bg-surface p-8"><div className="h-4 w-40 rounded bg-neutral-200" /><div className="mt-4 h-24 rounded-xl bg-neutral-100" /><span className="sr-only">Carregando dados do Dashboard…</span></div></div>;
  }

  if (games.length === 0) {
    return <div className="space-y-6"><PageTitle eyebrow="Visão geral" title="Dashboard" description="Acompanhe sua evolução, seus resultados e os próximos temas de estudo." /><MockNotice>Os dados, análises e recomendações desta versão são simulados. Nenhum modelo de IA, LLM ou motor de xadrez foi integrado.</MockNotice><section className="rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-14 text-center"><Swords className="mx-auto text-neutral-400" size={36} aria-hidden="true" /><h2 className="mt-4 text-lg font-semibold text-neutral-900">Nenhuma partida registrada</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">Quando houver partidas no histórico, suas métricas e gráficos aparecerão aqui.</p></section></div>;
  }

  const total = games.length;
  const currentRating = dashboard.sortedGames[0].playerRating;
  const winRate = (dashboard.wins / total) * 100;
  const recommendation = mockRecommendations.find((item) => !item.completed && item.priority === "high") ?? mockRecommendations[0];

  return (
    <div className="space-y-7">
      <PageTitle eyebrow="Visão geral" title="Dashboard" description="Acompanhe sua evolução, seus resultados e os próximos temas de estudo." />
      <MockNotice>Os dados, análises e recomendações desta versão são simulados. Nenhum modelo de IA, LLM ou motor de xadrez foi integrado.</MockNotice>
      <section aria-label="Métricas do jogador" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total de partidas" value={total} icon={Swords} detail="Partidas no histórico" />
        <StatCard label="Vitórias" value={dashboard.wins} icon={Trophy} detail="Resultados vencidos" />
        <StatCard label="Derrotas" value={dashboard.losses} icon={XCircle} detail="Oportunidades de revisão" />
        <StatCard label="Empates" value={dashboard.draws} icon={CircleEqual} detail="Resultados equilibrados" />
        <StatCard label="Taxa de vitória" value={`${winRate.toFixed(1)}%`} icon={Target} detail="Vitórias sobre o total" />
        <StatCard label="Rating atual" value={currentRating} icon={Gauge} detail="Registro da partida mais recente" />
      </section>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.85fr)]"><RatingChart data={dashboard.ratingHistory} /><ResultsChart wins={dashboard.wins} losses={dashboard.losses} draws={dashboard.draws} /></div>
      <div className="grid gap-6 lg:grid-cols-2"><FrequentMistakes mistakes={dashboard.mistakes} /><PopularOpenings openings={dashboard.openings} /></div>
      <RecentGames games={dashboard.sortedGames.slice(0, 5)} />
      <StudyRecommendation recommendation={recommendation} />
    </div>
  );
}
