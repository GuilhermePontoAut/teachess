"use client";

import { ArrowLeft, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MockNotice } from "@/components/MockNotice";
import { PageTitle } from "@/components/PageTitle";
import { currentUser } from "@/lib/data/users";
import type { ChessGame } from "@/lib/types/chess";
import { canViewGame } from "@/lib/utils/gameRules";
import { hydrateGameStore, useGameStore } from "@/store/useGameStore";
import { GameFormLoading } from "./NewGameContent";

export function GameAnalysisContent({ id }: { id: string }) {
  const getGameById = useGameStore((state) => state.getGameById);
  const [game, setGame] = useState<ChessGame | null | undefined>(undefined);
  useEffect(() => { let active = true; void hydrateGameStore().then(() => { if (active) setGame(getGameById(id) ?? null); }); return () => { active = false; }; }, [getGameById, id]);
  if (game === undefined) return <GameFormLoading title="Análise da partida" description="Carregando a partida armazenada neste navegador." />;
  if (game === null || !canViewGame(currentUser, game)) return <div className="space-y-6"><PageTitle eyebrow="Análise simulada" title="Partida não encontrada" description="A partida não existe ou não está disponível para este usuário." /><Link href="/partidas" className="inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white"><ArrowLeft size={17} />Voltar para Minhas Partidas</Link></div>;
  return <div className="space-y-6"><PageTitle eyebrow="Análise simulada" title={`Análise: ${game.title}`} description={`Revisão demonstrativa da partida contra ${game.opponent}.`} /><MockNotice>Nenhuma análise real foi executada. Não há IA, LLM ou motor de xadrez integrado nesta versão.</MockNotice><section className="rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-14 text-center"><BarChart3 className="mx-auto text-neutral-400" size={36} /><h2 className="mt-4 text-lg font-semibold">Análise indisponível no protótipo</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted">Este espaço representa o futuro fluxo de revisão sem afirmar que houve processamento inteligente da partida.</p><Link href={`/partidas/${game.id}`} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold hover:bg-neutral-100"><ArrowLeft size={17} />Voltar aos detalhes</Link></section></div>;
}
