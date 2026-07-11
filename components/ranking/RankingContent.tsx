"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { currentUser } from "@/lib/data/users";
import type { RankingPlayer } from "@/lib/types/chess";
import { getCommunitySummary, matchesRatingRange, mergeCurrentUserStats, rankPlayers, sortRankingView } from "@/lib/utils/ranking";
import { hydrateGameStore, useGameStore } from "@/store/useGameStore";
import { hydrateRankingStore, useRankingStore } from "@/store/useRankingStore";
import { CurrentUserRankingCard } from "./CurrentUserRankingCard";
import { PublicPlayerDetailsDialog } from "./PublicPlayerDetailsDialog";
import { RankingEmptyState } from "./RankingEmptyState";
import { RankingFilters, type RankingFilterState } from "./RankingFilters";
import { RankingHeader } from "./RankingHeader";
import { RankingPodium } from "./RankingPodium";
import { RankingRulesDialog } from "./RankingRulesDialog";
import { RankingSummary } from "./RankingSummary";
import { RankingTable } from "./RankingTable";
import { levelLabels } from "./ranking";

const initialFilters: RankingFilterState = { query: "", region: "all", level: "all", ratingRange: "all", sort: "official" };
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");

export function RankingContent() {
  const players = useRankingStore((state) => state.players);
  const games = useGameStore((state) => state.games);
  const [hydrated, setHydrated] = useState(false);
  const [filters, setFilters] = useState(initialFilters);
  const [profile, setProfile] = useState<RankingPlayer | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);

  useEffect(() => { let active = true; Promise.all([hydrateRankingStore(), hydrateGameStore()]).finally(() => { if (active) setHydrated(true); }); return () => { active = false; }; }, []);

  const officialPlayers = useMemo(() => rankPlayers(mergeCurrentUserStats(players, games, currentUser.id, currentUser.currentPlatformRating)), [players, games]);
  const regions = useMemo(() => [...new Set(officialPlayers.map((player) => player.region))].sort((a, b) => a.localeCompare(b, "pt-BR")), [officialPlayers]);
  const levels = useMemo(() => [...new Set(officialPlayers.map((player) => player.level))], [officialPlayers]);
  const visiblePlayers = useMemo(() => {
    const query = normalize(filters.query.trim());
    const filtered = officialPlayers.filter((player) => (!query || normalize(`${player.name} ${player.region} ${levelLabels[player.level]}`).includes(query)) && (filters.region === "all" || player.region === filters.region) && (filters.level === "all" || player.level === filters.level) && matchesRatingRange(player.currentPlatformRating, filters.ratingRange));
    return sortRankingView(filtered, filters.sort);
  }, [officialPlayers, filters]);
  const current = officialPlayers.find((player) => player.id === currentUser.id);
  const playerAbove = current && current.position > 1 ? officialPlayers[current.position - 2] : undefined;
  const hasFilters = filters.query !== "" || filters.region !== "all" || filters.level !== "all" || filters.ratingRange !== "all";

  if (!hydrated) return <div className="flex min-h-80 items-center justify-center rounded-2xl border border-line bg-white" role="status"><LoaderCircle className="animate-spin" size={24} aria-hidden="true" /><span className="ml-3 text-sm font-medium">Carregando ranking oficial…</span></div>;
  if (!officialPlayers.length) return <div className="space-y-7"><RankingHeader onOpenRules={() => setRulesOpen(true)} /><RankingEmptyState filtered={false} /><RankingRulesDialog open={rulesOpen} onClose={() => setRulesOpen(false)} /></div>;

  return <div className="min-w-0 space-y-8"><RankingHeader onOpenRules={() => setRulesOpen(true)} /><RankingPodium players={officialPlayers} /><RankingSummary summary={getCommunitySummary(officialPlayers)} />{current ? <CurrentUserRankingCard player={current} playerAbove={playerAbove} /> : <div role="status" className="rounded-2xl border border-dashed border-line-strong bg-white p-5"><h2 className="font-semibold">Jogador atual não encontrado</h2><p className="mt-1 text-sm text-muted">Não foi possível associar o perfil atual ao ranking simulado.</p></div>}<RankingFilters filters={filters} regions={regions} levels={levels} onChange={setFilters} onClear={() => setFilters(initialFilters)} /><section aria-labelledby="ranking-list-title"><div className="mb-4 flex flex-wrap items-end justify-between gap-2"><div><h2 id="ranking-list-title" className="text-xl font-semibold">Classificação completa</h2><p className="mt-1 text-sm text-muted">{visiblePlayers.length} de {officialPlayers.length} jogadores</p></div></div>{visiblePlayers.length ? <RankingTable players={visiblePlayers} onProfile={setProfile} /> : <RankingEmptyState filtered={hasFilters} onClear={() => setFilters(initialFilters)} />}</section><PublicPlayerDetailsDialog player={profile} onClose={() => setProfile(null)} /><RankingRulesDialog open={rulesOpen} onClose={() => setRulesOpen(false)} /></div>;
}
