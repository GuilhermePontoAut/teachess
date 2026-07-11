"use client";

import { CircleEqual, ExternalLink, Gauge, Monitor, Swords, Target, Trophy, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MockNotice } from "@/components/MockNotice";
import { PageTitle } from "@/components/PageTitle";
import { mockAnalyses } from "@/lib/data/analyses";
import { mockRecommendations } from "@/lib/data/recommendations";
import { currentUser } from "@/lib/data/users";
import type { ErrorCategory } from "@/lib/types/chess";
import { sortGamesByDate } from "@/lib/utils/chess";
import { countsForOfficialStats } from "@/lib/utils/gameRules";
import { hydrateGameStore, useGameStore } from "@/store/useGameStore";
import { hydrateUserPreferencesStore, useUserPreferencesStore } from "@/store/useUserPreferencesStore";
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
  const includeExternal = useUserPreferencesStore((state) => state.includeExternalGames);
  const setIncludeExternal = useUserPreferencesStore((state) => state.setIncludeExternalGames);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { let active = true; void Promise.all([hydrateGameStore(), hydrateUserPreferencesStore()]).finally(() => { if (active) setHydrated(true); }); return () => { active = false; }; }, []);

  const dashboard = useMemo(() => {
    const platformGames = games.filter(countsForOfficialStats);
    const externalGames = games.filter((game) => game.origin === "external");
    const visibleGames = includeExternal ? games : platformGames;
    const sortedGames = sortGamesByDate(visibleGames);
    const wins = visibleGames.filter((game) => game.result === "win").length;
    const losses = visibleGames.filter((game) => game.result === "loss").length;
    const draws = visibleGames.filter((game) => game.result === "draw").length;
    const openingCounts = visibleGames.reduce<Map<string, number>>((counts, game) => game.opening ? counts.set(game.opening, (counts.get(game.opening) ?? 0) + 1) : counts, new Map());
    const openings: CountItem[] = [...openingCounts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "pt-BR")).slice(0, 5);
    const visibleIds = new Set(visibleGames.map((game) => game.id));
    const categoryCounts = mockAnalyses.filter((analysis) => visibleIds.has(analysis.gameId)).flatMap((analysis) => analysis.errorCategories).reduce<Map<ErrorCategory, number>>((counts, category) => counts.set(category, (counts.get(category) ?? 0) + 1), new Map());
    const mistakes: CountItem[] = [...categoryCounts].map(([category, count]) => ({ name: errorCategoryLabels[category], count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "pt-BR")).slice(0, 5);
    const ratingHistory = [...platformGames].sort((a, b) => a.date.localeCompare(b.date)).map((game) => ({ date: game.date, rating: game.playerRatingAtGame }));
    return { platformGames, externalGames, visibleGames, sortedGames, wins, losses, draws, openings, mistakes, ratingHistory };
  }, [games, includeExternal]);

  if (!hydrated) return <div role="status" aria-live="polite" className="space-y-6"><PageTitle eyebrow="Visão geral" title="Dashboard" description="Acompanhe sua evolução, seus resultados e os próximos temas de estudo." /><div className="animate-pulse rounded-2xl border border-line bg-surface p-8"><div className="h-4 w-40 rounded bg-neutral-200" /><div className="mt-4 h-24 rounded-xl bg-neutral-100" /><span className="sr-only">Carregando dados do Dashboard…</span></div></div>;
  const total = dashboard.visibleGames.length;
  const winRate = total ? (dashboard.wins / total) * 100 : 0;
  const recommendation = mockRecommendations.find((item) => !item.completed && item.priority === "high") ?? mockRecommendations[0];
  return <div className="space-y-7"><PageTitle eyebrow="Visão geral" title="Dashboard" description="Acompanhe sua evolução, seus resultados e os próximos temas de estudo." /><MockNotice>Os dados, análises e recomendações desta versão são simulados. Nenhum modelo de IA, LLM ou motor de xadrez foi integrado.</MockNotice>
    <section aria-labelledby="dashboard-view-title" className="rounded-2xl border border-line bg-surface p-5 shadow-sm"><h2 id="dashboard-view-title" className="font-semibold">Visualização das estatísticas pessoais</h2><label className="mt-3 flex cursor-pointer items-start gap-3"><input type="checkbox" checked={includeExternal} onChange={(event) => setIncludeExternal(event.target.checked)} className="mt-1 size-4 accent-neutral-950" /><span><span className="block text-sm font-semibold">Incluir partidas externas</span><span className="mt-1 block text-xs leading-5 text-muted">Desativado: somente partidas da plataforma. Ativado: visão pessoal combinada.</span></span></label>{includeExternal && <p className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">Visão combinada e privada. Partidas externas não entram nas estatísticas públicas, no ranking ou na evolução oficial do rating.</p>}</section>
    <section aria-label="Métricas do jogador" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><StatCard label={includeExternal ? "Total combinado" : "Total de partidas"} value={total} icon={Swords} detail={includeExternal ? "Visão privada: plataforma + externas" : "Somente partidas da plataforma"} /><StatCard label="Partidas da plataforma" value={dashboard.platformGames.length} icon={Monitor} /><StatCard label="Partidas externas" value={dashboard.externalGames.length} icon={ExternalLink} /><StatCard label="Vitórias" value={dashboard.wins} icon={Trophy} /><StatCard label="Derrotas" value={dashboard.losses} icon={XCircle} /><StatCard label="Empates" value={dashboard.draws} icon={CircleEqual} /><StatCard label="Taxa de vitória" value={`${winRate.toFixed(1)}%`} icon={Target} /><StatCard label="Rating atual" value={currentUser.currentPlatformRating} icon={Gauge} detail="Rating oficial atual no TeaChess" /></section>
    {total === 0 ? <section className="rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-14 text-center"><Swords className="mx-auto text-neutral-400" size={36} /><h2 className="mt-4 text-lg font-semibold">Nenhuma partida nesta visualização</h2></section> : <><div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.85fr)]"><RatingChart data={dashboard.ratingHistory} /><ResultsChart wins={dashboard.wins} losses={dashboard.losses} draws={dashboard.draws} /></div><div className="grid gap-6 lg:grid-cols-2"><FrequentMistakes mistakes={dashboard.mistakes} /><PopularOpenings openings={dashboard.openings} /></div><RecentGames games={dashboard.sortedGames.slice(0, 5)} /><StudyRecommendation recommendation={recommendation} /></>}
  </div>;
}
