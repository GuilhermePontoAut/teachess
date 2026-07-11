"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MockNotice } from "@/components/MockNotice";
import { PageTitle } from "@/components/PageTitle";
import { GameFormLoading } from "@/components/games/NewGameContent";
import { mockAnalyses } from "@/lib/data/analyses";
import { mockRecommendations } from "@/lib/data/recommendations";
import { currentUser } from "@/lib/data/users";
import type { ChessGame, GameAnalysis } from "@/lib/types/chess";
import { buildGameReplay, createStaticDemoAnalysis, getCriticalPly } from "@/lib/utils/analysis";
import { canViewGame } from "@/lib/utils/gameRules";
import { hydrateGameStore, useGameStore } from "@/store/useGameStore";
import { AnalysisBoard } from "./AnalysisBoard";
import { AnalysisEmptyState } from "./AnalysisEmptyState";
import { AnalysisHeader } from "./AnalysisHeader";
import { AnalysisSummary } from "./AnalysisSummary";
import { CoachComment } from "./CoachComment";
import { CriticalMomentCard } from "./CriticalMomentCard";
import { ErrorCategories } from "./ErrorCategories";
import { EvaluationChart } from "./EvaluationChart";
import { MoveList } from "./MoveList";
import { StrengthsWeaknesses } from "./StrengthsWeaknesses";

const backClass = "inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

export function AnalysisContent({ id }: { id: string }) {
  const getGameById = useGameStore((state) => state.getGameById);
  const [game, setGame] = useState<ChessGame | null | undefined>(undefined);
  const [demoAnalysis, setDemoAnalysis] = useState<GameAnalysis | null>(null);
  const [currentPly, setCurrentPly] = useState(0);

  useEffect(() => {
    let active = true;
    void hydrateGameStore().then(() => { if (active) setGame(getGameById(id) ?? null); });
    return () => { active = false; };
  }, [getGameById, id]);

  const storedAnalysis = useMemo(() => mockAnalyses.find((analysis) => analysis.gameId === id), [id]);
  const analysis = storedAnalysis ?? demoAnalysis;
  const replay = useMemo(() => game ? buildGameReplay(game) : null, [game]);

  if (game === undefined) return <GameFormLoading title="Análise da partida" description="Carregando a partida armazenada neste navegador." />;
  // Esta checagem protege apenas o protótipo no cliente. A validação real de acesso deverá ocorrer no backend futuramente.
  if (game === null || !canViewGame(currentUser, game)) return <UnavailableGame />;

  if (!analysis) return <div className="space-y-6"><AnalysisHeader game={game} /><MockNotice>Esta análise é uma demonstração simulada. Nenhum modelo de IA, LLM ou motor de xadrez foi utilizado.</MockNotice><AnalysisEmptyState status={game.analysisStatus === "pending" ? "pending" : "not_analyzed"} gameId={game.id} onLoadDemo={() => setDemoAnalysis(createStaticDemoAnalysis(game.id))} /></div>;

  const criticalPlies = new Map(analysis.criticalMoments.map((moment) => [moment.id, getCriticalPly(moment.moveNumber, moment.move, replay?.moves ?? [])]));
  const currentCriticalId = analysis.criticalMoments.find((moment) => criticalPlies.get(moment.id) === currentPly)?.id;
  const recommendation = mockRecommendations.find((item) => item.relatedGameIds.includes(game.id));

  return <div className="space-y-6"><AnalysisHeader game={game} /><MockNotice>Esta análise é uma demonstração simulada. Nenhum modelo de IA, LLM ou motor de xadrez foi utilizado.</MockNotice>
    {demoAnalysis && <p role="status" className="rounded-xl border border-neutral-300 bg-neutral-100 p-3 text-sm font-medium">Modelo estático de demonstração carregado. O status histórico da partida não foi alterado.</p>}
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,.65fr)]"><AnalysisBoard positions={replay?.positions ?? []} moves={replay?.moves ?? []} currentPly={currentPly} playerColor={game.playerColor} navigable={replay?.navigable ?? false} error={replay?.error ?? null} onNavigate={setCurrentPly} /><MoveList moves={replay?.moves ?? []} currentPly={currentPly} criticalPlies={new Set(criticalPlies.values())} onNavigate={setCurrentPly} /></div>
    <div className="grid gap-5 xl:grid-cols-2"><AnalysisSummary analysis={analysis} /><EvaluationChart data={analysis.evaluationHistory} /></div>
    <section aria-labelledby="critical-title"><div className="mb-4"><h2 id="critical-title" className="text-2xl font-semibold">Momentos críticos</h2><p className="mt-1 text-sm text-muted">Selecione um card para navegar até o lance correspondente. As alternativas não foram calculadas por motor.</p></div>{analysis.criticalMoments.length ? <div className="grid gap-4 md:grid-cols-2">{analysis.criticalMoments.map((moment) => { const ply = criticalPlies.get(moment.id) ?? 0; const move = replay?.moves[ply - 1]; const player = move && move.color === game.playerColor ? currentUser.name : game.opponent; return <CriticalMomentCard key={moment.id} moment={moment} player={player || "Não informado"} selected={currentCriticalId === moment.id} onSelect={() => setCurrentPly(ply)} />; })}</div> : <div className="rounded-2xl border border-dashed border-line-strong bg-surface p-8 text-center text-sm text-muted">Nenhum momento crítico informado neste modelo de demonstração.</div>}</section>
    <StrengthsWeaknesses analysis={analysis} />
    <div className="grid items-start gap-5 lg:grid-cols-[.8fr_1.2fr]"><ErrorCategories analysis={analysis} /><CoachComment analysis={analysis} recommendation={recommendation} /></div>
  </div>;
}

function UnavailableGame() { return <div className="space-y-6"><PageTitle eyebrow="Análise simulada" title="Partida não encontrada" description="A partida não existe ou não está disponível para este usuário." /><Link href="/partidas" className={backClass}><ArrowLeft size={17} aria-hidden="true" />Voltar para Minhas Partidas</Link></div>; }
