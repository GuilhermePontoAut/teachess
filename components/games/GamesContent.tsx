"use client";

import { Plus, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MockNotice } from "@/components/MockNotice";
import { PageTitle } from "@/components/PageTitle";
import type { ChessGame } from "@/lib/types/chess";
import { hydrateGameStore, useGameStore } from "@/store/useGameStore";
import { DeleteGameDialog } from "./DeleteGameDialog";
import { EmptyGamesState } from "./EmptyGamesState";
import { GameCard } from "./GameCard";
import { GameFilters } from "./GameFilters";
import { GameTable } from "./GameTable";
import { GamesSummary } from "./GamesSummary";
import { initialGameFilters, type GameFilterState } from "./games";

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");

export function GamesContent({ initialMessage = "" }: { initialMessage?: string }) {
  const games = useGameStore((state) => state.games);
  const deleteGame = useGameStore((state) => state.deleteGame);
  const resetGames = useGameStore((state) => state.resetGames);
  const [hydrated, setHydrated] = useState(false);
  const [filters, setFilters] = useState<GameFilterState>(initialGameFilters);
  const [gameToDelete, setGameToDelete] = useState<ChessGame | null>(null);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [message, setMessage] = useState(initialMessage);

  useEffect(() => { let active = true; void hydrateGameStore().finally(() => { if (active) setHydrated(true); }); return () => { active = false; }; }, []);
  const openings = useMemo(() => [...new Set(games.map((game) => game.opening))].sort((a, b) => a.localeCompare(b, "pt-BR")), [games]);
  const visibleGames = useMemo(() => {
    const query = normalize(filters.query.trim());
    const filtered = games.filter((game) => {
      const searchable = [game.opponent, game.title, game.event, game.opening, ...game.tags].map(normalize);
      return (!query || searchable.some((value) => value.includes(query))) && (filters.result === "all" || game.result === filters.result) && (filters.color === "all" || game.playerColor === filters.color) && (filters.analysis === "all" || game.analysisStatus === filters.analysis) && (filters.opening === "all" || game.opening === filters.opening);
    });
    return filtered.sort((a, b) => {
      if (filters.sort === "oldest") return a.date.localeCompare(b.date);
      if (filters.sort === "rating-desc") return b.opponentRating - a.opponentRating;
      if (filters.sort === "rating-asc") return a.opponentRating - b.opponentRating;
      if (filters.sort === "accuracy-desc") return (b.accuracy ?? -1) - (a.accuracy ?? -1);
      if (filters.sort === "accuracy-asc") return (a.accuracy ?? Number.POSITIVE_INFINITY) - (b.accuracy ?? Number.POSITIVE_INFINITY);
      return b.date.localeCompare(a.date);
    });
  }, [filters, games]);
  const hasFilters = filters.query !== "" || filters.result !== "all" || filters.color !== "all" || filters.analysis !== "all" || filters.opening !== "all";

  if (!hydrated) return <div role="status" aria-live="polite" className="space-y-6"><PageTitle eyebrow="Histórico" title="Minhas Partidas" description="Consulte, organize e acompanhe todas as suas partidas." /><div className="animate-pulse rounded-2xl border border-line bg-surface p-6"><div className="h-5 w-48 rounded bg-neutral-200" /><div className="mt-5 h-32 rounded-xl bg-neutral-100" /><span className="sr-only">Carregando partidas…</span></div></div>;

  return <div className="space-y-7">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><PageTitle eyebrow="Histórico" title="Minhas Partidas" description="Consulte, pesquise e organize as partidas armazenadas neste navegador." /><div className="flex flex-col gap-2 sm:flex-row"><button type="button" onClick={() => setRestoreOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 shadow-sm hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"><RotateCcw size={17} aria-hidden="true" />Restaurar dados de demonstração</button><Link href="/partidas/nova" className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"><Plus size={17} aria-hidden="true" />Nova partida</Link></div></div>
    {message && <div role="status" aria-live="polite" className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">{message}</div>}
    <MockNotice>As partidas, precisões e estados de análise desta versão são simulados e armazenados somente neste navegador.</MockNotice>
    <GamesSummary games={games} />
    <GameFilters filters={filters} openings={openings} onChange={(changes) => { setFilters((current) => ({ ...current, ...changes })); setMessage(""); }} onClear={() => setFilters(initialGameFilters)} />
    {visibleGames.length === 0 ? <EmptyGamesState filtered={games.length > 0 && hasFilters} /> : <><GameTable games={visibleGames} onDelete={setGameToDelete} /><div className="grid gap-4 lg:hidden">{visibleGames.map((game) => <GameCard key={game.id} game={game} onDelete={setGameToDelete} />)}</div></>}
    <DeleteGameDialog open={gameToDelete !== null} title="Excluir partida?" description={`A partida contra ${gameToDelete?.opponent ?? "este adversário"} será removida deste navegador. Esta ação não pode ser desfeita.`} confirmLabel="Excluir partida" destructive onCancel={() => setGameToDelete(null)} onConfirm={() => { if (gameToDelete) { deleteGame(gameToDelete.id); setMessage(`Partida contra ${gameToDelete.opponent} excluída.`); } setGameToDelete(null); }} />
    <DeleteGameDialog open={restoreOpen} title="Restaurar dados de demonstração?" description="As partidas atuais serão substituídas pelos dados simulados originais do TeaChess." confirmLabel="Restaurar dados" onCancel={() => setRestoreOpen(false)} onConfirm={() => { resetGames(); setRestoreOpen(false); setMessage("Dados de demonstração restaurados com sucesso."); }} />
  </div>;
}
